# THE LAG MUSEUM

An interactive museum of imperfect camera-based vital-sign measurements, built for the Presage SmartSpectra SDK Challenge 2026.

## Status

Development scaffold, v0.2 experiment-replay implementation available locally. **Windows/Electron and live SmartSpectra webcam measurements are not yet verified.** Do not present synthetic vitals as real.

## Concept

Four interactive rooms: the 12-second pulse analysis window, motion disruption, poor lighting, and confidence-versus-validity. Experiment Replay compares actual numerical SDK observations. Camera consent is required before capture.

## Local development

Windows 11, Node.js 20+, webcam, Presage SDK key.

```powershell
npm install
npm test
npm run build
npm start
```

Never commit SDK keys, camera recordings, dependencies or generated build output. Do not assume a 12-second measurement window is a fixed delay.

**Repository initialization note:** Source files are not yet synchronized to this repository. The working project is under `C:\Users\dmano\Desktop\LagMuseum\lag-museum`; finish the initial source push before considering this repository runnable.
