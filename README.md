# DEVICE REPAIR

A bilingual (English / Persian) interactive 3D hardware-learning website built for GitHub Pages.

## Features
- Cozy real-time WebGL electronics repair room
- Interactive smartphone, tablet, laptop and desktop PC
- Exploded hardware views with smooth assembly/disassembly
- Clickable CPU, GPU, RAM, motherboard, battery, storage, display, camera, cooling and more
- Screen-space labels that track 3D component positions while the camera moves
- Component focus mode and educational information panel
- Relationship visualization and laptop/desktop cooling demo
- English LTR and Persian RTL UI
- Touch-friendly controls and responsive UI
- Graceful fallback if WebGL is unavailable

## Run locally
Serve the repository from any static HTTP server. The project uses native ES modules and Three.js from jsDelivr.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages
The site is static and the repository includes a GitHub Actions Pages workflow that publishes the `main` branch.
