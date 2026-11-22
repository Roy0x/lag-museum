# THE LAG MUSEUM
**An Interactive Museum of Imperfect Measurements** — Presage SmartSpectra SDK Challenge 2026.

A desktop Electron exhibit that teaches how contactless pulse measurement works and why motion, lighting, and frame quality matter. It uses the official **SmartSpectra** SDK with real local webcam capture. It never generates simulated vital measurements.

## Status
**Development scaffold / hardware verification pending.** Includes an implemented Electron live-camera SDK pipeline, four exhibit narratives, signal window, quality feedback and disruption comparison. **Not yet verified against a real Windows webcam or API key.** Never claim otherwise.

## Requirements
- Windows 11 x64 (also supported on other SDK desktop targets)
- Node.js 20+ (24 recommended)
- Working webcam and camera permissions
- SmartSpectra developer API key: https://physiology.presagetech.com/
- Free disk space: the SDK installation downloads native runtimes, potentially several hundred MB. Free at least 3 GB beforehand.

## Run (PowerShell)
```powershell
npm install
npm test
npm start
```
Paste the API key into the app's password field. The field is cleared after SDK initialization; it is not saved to a file, localStorage or logs. Do **not** publish your key in code, screenshots, DEV posts or GitHub commits. The key necessarily exists in process memory during the SDK session; review the SDK vendor's data policy.

Camera access is requested only when the visitor presses **Enable live camera**. Click **Stop** to release the camera. Windows camera privacy settings may also require enabling camera access for desktop apps.

## Four rooms
1. **The Invisible Pulse:** 12-second pulse analysis window; genuine SDK output only.
2. **Break the Signal:** mark a disturbance then deliberately move; inspect actual confidence and validation behavior.
3. **The Dark Room:** change real room lighting; inspect actual SDK feedback.
4. **The Trust Test:** examine stable/confidence/validation alongside reported BPM.

## Privacy and scientific scope
- Local webcam frames are processed by the Presage SDK; the app does not save or transmit video intentionally.
- Numerical samples and quality event counts are held **in memory only**, capped at 1,500 samples per session. They are cleared when a new session starts or the app exits. The replay is not persisted to disk.
- API key is entered manually per session and is not persisted by the app.
- No user accounts, analytics, advertising, automatic telemetry or external AI services are implemented in this application. SmartSpectra is created with `enableTelemetry: false`; its readiness and measurement checks can still require its service authentication.
- The exhibit uses system font fallbacks and makes no external font request.
- Not a medical device. No diagnostic or treatment claims. These readings are informational only.
- A pulse **12-second analysis window** is not a 12-second output transmission delay. Do not call it one.
- Bad lighting or motion may not always produce obvious pulse changes. Never inject fake artifacts into a plot presented as SDK output.

## Verification before submission
- [ ] SDK installation succeeds on Windows x64.
- [ ] Camera consent occurs only after pressing Start.
- [ ] `streamAvailable`, `metrics`, `validationStatus` are observed on the target webcam.
- [ ] Real pulse appears after sufficient warm-up.
- [ ] Stop releases the camera and Start can reacquire it.
- [ ] Bad-light and motion experiments produce honest observed evidence, even if a warning is not emitted.
- [ ] Examine official SDK validation codes; replace the current best-effort textual warning classification with the SDK's defined statuses before claiming warning counts as authoritative.
- [ ] Review SDK telemetry and external-resource disclosures.
- [ ] Run `npm test`, verify no API keys, produce a real-screen demo video and publish repository.

## Agent work order
Read [CODEX_TASK.md](CODEX_TASK.md) for the next implementation steps, failure criteria and required evidence.

Docs: https://presagetech.com/docs/smartspectra-sdk/nodejs | https://presagetech.com/docs/smartspectra-sdk/measurement-quality


## Webcam performance troubleshooting

Before each measurement, after explicit consent, the app runs a local 10-second camera probe and displays the browser-reported camera label, active resolution, observed presentation FPS, and dropped-frame count. It then releases that probe stream and runs SmartSpectra `checkDeviceReadiness()` before beginning a measurement. A non-`ready` verdict does not start measurement; its exact reason remains in the diagnostic panel. Probe diagnostics are shown only in the running session and are not saved.

If SmartSpectra reports `kSustainedLowFrameRate (14)`, it stopped physiological processing because camera frame delivery stayed too slow. This is **not proof the API key failed**. Close other camera apps and CPU-heavy work, use consistent front-facing lighting, check Windows camera settings, reconnect the webcam directly, and start a new session. A webcam preview by itself is not evidence of working physiological measurements.

The application displays real SDK errors; never fabricate pulse readings as a fallback. The local app does not persist the API key. Do not commit keys or screenshots showing them. Windows webcam/live SDK verification remains outstanding until performed on hardware.
