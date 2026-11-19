import { SmartSpectraSDK } from '@smartspectra/node-sdk/renderer';
import { breathingMetrics, cardioMetrics } from '@smartspectra/node-sdk/renderer';
import { decodeMetrics } from '@smartspectra/node-sdk/messages';
import { normalizeSample, comparePeriods, PULSE_WINDOW_SECONDS } from './measurements.mjs';

const $ = id => document.getElementById(id);
const rooms = [
  { name:'The Invisible Pulse', title:'The Invisible Pulse', description:'Your camera estimates subtle changes in light reflected from your face. Watch an estimate emerge from a 12-second analysis window.', instruction:'Sit in good lighting, stay centered and observe the window fill.', label:'Observe the pulse estimation warm-up.' },
  { name:'Break the Signal', title:'Break the Signal', description:'Movement changes the video frames the SDK analyzes. Mark the moment you begin moving and inspect what actually happens.', instruction:'First sit still for 15 seconds. Mark disruption, then gently turn your head or move. Do not assume failure in advance.', label:'Challenge the camera with movement.' },
  { name:'The Dark Room', title:'The Dark Room', description:'Light determines what the camera can observe. Change room lighting and watch the real SDK feedback.', instruction:'First measure in good light, mark disruption, then dim the room light. Avoid looking directly at bright lights.', label:'Compare well-lit and dim conditions.' },
  { name:'The Trust Test', title:'The Trust Test', description:'A plausible pulse number is not proof of a good measurement. Compare confidence, stability, and validation warnings.', instruction:'Measure in good conditions. Mark disruption and change your position or lighting; inspect all three indicators, not just BPM.', label:'Investigate evidence quality, not just the number.' },
];
let currentRoom = 0;
let sdk = null;
let running = false;
let startedAt = 0;
let splitAt = null;
let samples = [];
let lastReading = null;
let validationHint = 'Waiting for SDK feedback';
let validationWarning = false;
let ticker = null;

const safe = err => String(err?.message || err || 'Unknown SDK error');
const percent = v => v == null ? 'â€”' : `${Math.round(v)}`;
const format = v => v == null ? 'â€”' : `${Math.round(v)}`;
const elapsedSeconds = () => running ? Math.max(0,(Date.now()-startedAt)/1000) : 0;
const paintRoom = () => {
  const room=rooms[currentRoom];
  $('chapter').textContent=`EXHIBIT 0${currentRoom+1} / 04`;
  $('room-number').textContent=`0${currentRoom+1}`;
  $('room-title').innerHTML=`${room.title}<span class="accent">.</span>`;
  $('room-description').textContent=room.description;
  $('instruction').textContent=room.instruction;
  document.querySelectorAll('.room').forEach((item,i)=>item.classList.toggle('active',i===currentRoom));
};
rooms.forEach((r,i)=>{
  const button=document.createElement('button');
  button.className='room';button.innerHTML=`<span>0${i+1}</span>${r.name}`;
  button.addEventListener('click',()=>{currentRoom=i;paintRoom();});
  $('rooms').append(button);
});
paintRoom();
function showStatus(value, active=false) {
  $('connection').textContent=value;
  $('connection').classList.toggle('live',active);
}
function setHint(message){ $('live-hint').textContent=message; }
function clearStream(){const video=$('preview'); video.pause(); video.srcObject=null; $('preview-overlay').classList.remove('hidden');}
function redraw(){
  const elapsed=elapsedSeconds();
  const mm=String(Math.floor(elapsed/60)).padStart(2,'0');
  const ss=String(Math.floor(elapsed%60)).padStart(2,'0');
  $('elapsed').textContent=`${mm}:${ss}`;
  $('clock').textContent=running?'LOCAL Â· IN PROGRESS':'SESSION NOT STARTED';
  const progress=Math.min(100, elapsed/PULSE_WINDOW_SECONDS*100);
  $('window-percent').textContent=`${Math.round(progress)}%`;
  $('window-progress').style.width=`${progress}%`;
  const ready=elapsed >= PULSE_WINDOW_SECONDS;
  $('pulse').textContent=ready?format(lastReading?.pulse):'â€”';
  $('confidence').textContent=ready?percent(lastReading?.pulseConfidence):'â€”';
  $('stability').textContent=!ready?'Warming up':lastReading?.pulseStable === true?'Stable':lastReading?.pulseStable===false?'Unstable':'Unknown';
  $('validation').textContent=validationHint.length>45?`${validationHint.slice(0,43)}â€¦`:validationHint;
  $('sample-count').textContent=String(samples.length);
  if(splitAt!=null){
    const compare=comparePeriods(samples,splitAt);
    $('before').textContent=compare.before.meanPulseConfidence==null?'â€”':`${Math.round(compare.before.meanPulseConfidence)}%`;
    $('after').textContent=compare.after.meanPulseConfidence==null?'â€”':`${Math.round(compare.after.meanPulseConfidence)}%`;
    $('experiment-explanation').textContent=`Before: ${compare.before.samples} SDK samples, ${compare.before.warningCount} warnings. After: ${compare.after.samples} samples, ${compare.after.warningCount} warnings. These are observations, not proof of any causal effect.`;
  }
  drawHistory();
}
function drawHistory(){
  const canvas=$('chart'), ctx=canvas.getContext('2d');
  const {width:w,height:h}=canvas;
  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle='#263b52';ctx.lineWidth=1;
  for(let i=0;i<=4;i++){const y=12+i*(h-24)/4;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  const recent=samples.slice(-80);
  if(recent.length<2)return;
  const valid=recent.map((v,i)=>({...v,i})).filter(v=>Number.isFinite(v.pulse));
  if(valid.length<2)return;
  const min=Math.min(...valid.map(v=>v.pulse)),max=Math.max(...valid.map(v=>v.pulse));
  const span=Math.max(8,max-min);
  ctx.strokeStyle='#8bd7ff';ctx.lineWidth=2.6;ctx.beginPath();
  let drawing=false;let lastI=-2;
  recent.forEach((s,i)=>{
    if(!Number.isFinite(s.pulse)){drawing=false;return;}
    const x=(i/Math.max(1,recent.length-1))*(w-20)+10;
    const y=h-12-((s.pulse-min+(span-(max-min))/2)/span)*(h-24);
    if(!drawing||i!==lastI+1)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    drawing=true;lastI=i;
  });ctx.stroke();
  if(splitAt!=null){const splitIndex=recent.findIndex(s=>s.receivedAt>=splitAt);if(splitIndex>=0){ctx.strokeStyle='#ffbd7b';ctx.setLineDash([4,5]);ctx.beginPath();const x=10+splitIndex/Math.max(1,recent.length-1)*(w-20);ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();ctx.setLineDash([]);}}
}
function handleMetrics(buf){
  try{
    const decoded=decodeMetrics(buf);
    if(!decoded || typeof decoded !== 'object' || ArrayBuffer.isView(decoded))return;
    lastReading=normalizeSample(decoded);
    samples.push({...lastReading,validationWarning});
    if(samples.length>1500)samples.shift();
    redraw();
  }catch(err){setHint(`Metrics decode failed: ${safe(err)}`);}
}
async function start(){
  if(running)return;
  const key=$('api-key').value.trim();
  if(!key){setHint('Enter your Presage API key first. It stays in this session only.');$('api-key').focus();return;}
  $('start').disabled=true;
  setHint('Initializing SmartSpectra and requesting camera permissionâ€¦');
  samples=[];lastReading=null;splitAt=null;validationHint='Awaiting SDK validation';validationWarning=false;
  $('before').textContent='â€”';$('after').textContent='â€”';
  try{
    sdk=new SmartSpectraSDK({apiKey:key,requestedMetrics:[...breathingMetrics,...cardioMetrics]});
    sdk.on('streamAvailable',stream=>{
      $('preview').srcObject=stream;
      $('preview').play().catch(err=>setHint(`Camera preview: ${safe(err)}`));
      $('preview-overlay').classList.add('hidden');
      $('camera-label').textContent='LIVE CAMERA / CONSENTED';
    });
    sdk.on('metrics',buf=>handleMetrics(buf));
    sdk.on('validationStatus',(code,ts,hint)=>{
      validationHint=hint || `SDK validation code: ${code}`;
      // We do NOT guess the semantics of undocumented validation codes.
      validationWarning=Boolean(hint && /poor|low|dark|under|over|move|motion|missing|invalid|too|fail|warning/i.test(hint));
      redraw();
    });
    sdk.on('processingStatus',status=>{setHint(`SDK processing: ${String(status)}`);});
    sdk.on('error',(code,message,retryable)=>{setHint(`SDK error ${code}: ${message}${retryable?' (retryable)':''}`);showStatus('SDK ERROR');});
    await sdk.start();
    running=true;startedAt=Date.now();
    $('api-key').value=''; // key never persisted in DOM after SDK starts
    $('stop').disabled=false;$('marker').disabled=false;
    showStatus('CAPTURING',true);
    ticker=setInterval(redraw,250);redraw();
  }catch(err){
    setHint(`Cannot start: ${safe(err)}. Check API key, permissions and SDK installation.`);
    showStatus('FAILED');
    await stop();
  }
}
async function stop(){
  clearInterval(ticker);ticker=null;
  const current=sdk;sdk=null;
  if(current){try{if(typeof current.stopAsync==='function')await current.stopAsync();else await current.stop();}catch(e){setHint(`Stop warning: ${safe(e)}`);}try{await current.destroy();}catch{}}
  running=false;clearStream();
  $('camera-label').textContent='CAMERA INACTIVE';
  $('start').disabled=false;$('stop').disabled=true;$('marker').disabled=true;
  showStatus('OFFLINE');redraw();
}
$('start').addEventListener('click',start);
$('stop').addEventListener('click',stop);
$('marker').addEventListener('click',()=>{
  if(!running)return;
  splitAt=Date.now();
  setHint('Disruption marked. Change one real-world condition, then observe the SDK.');
  redraw();
});
window.addEventListener('beforeunload',()=>{if(sdk)void stop();});
redraw();

