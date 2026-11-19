# Codex implementation brief — THE LAG MUSEUM

**You are editing the existing project. Do not start another unrelated app or replace it with a mock.**

## Objective
Build and verify a premium interactive science exhibit in Electron, using **real** local SmartSpectra webcam signals. It has four rooms: Invisible Pulse, Break the Signal, Dark Room, Trust Test. This repository includes the desktop shell, partial SDK integration and experiments. Repair and extend it against the installed SDK, not against imagined APIs.

## First task: establish a real hardware baseline
1. Inspect repo and official SDK docs / official Electron sample.
2. Install official Codex skill: `npx skills add Presage-Security/SmartSpectra --skill using-smartspectra` if available, otherwise read official docs directly.
3. Verify Node/npm and free space. The machine may have very little free C: disk space. Do not delete unrelated user files.
4. `npm install`, `npm test`, `npm start` on Windows laptop. Check real `@smartspectra/node-sdk` exports and correct any import/bundle/lifecycle errors.
5. Ask the user to enter their API key into the app (do not ask them to paste it into chat, logs or code) and grant camera permission. Only user can perform those physical actions.
6. Verify live `streamAvailable`, `metrics`, `validationStatus` (or explain exact missing events) and capture a timestamped test report without photos or API key.
7. Do not claim fully working until one measured real pulse and actual SDK validation output have been observed.

## Quality and privacy hard requirements
- No mock/synthetic vitals, invented confidence/warnings, fabricated demo footage, or medical claims.
- Correctly distinguish 12-second analysis window from delay.
- Real motion and lighting experiments; do not engineer fake failure data.
- Consent is explicit; Stop releases webcam; handle camera unavailable, permission denied and auth failure.
- No credentials in Git, devtools output, commits, README or screenshots.
- Read and disclose Presage SDK telemetry policy, and remove external Google Font request if privacy policy calls for fully offline operation.
- Replace warning regex with documented `ValidationStatus` mapping, retain raw SDK code / hint as evidence.
- Avoid heavy 3D engine and large downloadable assets; user's laptop is Ryzen 7 5700U, 16 GB, integrated Radeon GPU and storage constrained.

## Polish after hardware works
- Implement persistent per-session room progress without fake achievements.
- Add actual event log, precise experiment marker timestamps, before/after comparison, export **opt-in JSON only** (no video, no API keys) and a 'delete session data' action.
- Make charts distinguish absent readings from zero values and mark exact SDK warnings.
- Keyboard navigation, responsive layout, meaningful errors and automated tests.
- Record a 45–90 second true demo with webcam preview and live metric behavior.
- Commit and push only after tests, credential scan, and user's approved GitHub destination.

## Deliverables
An app that runs on the target webcam, a brief verification report showing tested hardware/SDK outcomes, a public-repo-ready README, demo script and complete DEV submission draft. If a real SDK issue blocks progress, show exact failure and do not replace with mock values.
