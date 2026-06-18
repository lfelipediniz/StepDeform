# StepDeform - Expanding Minds

Interactive React visualizer of the **polar-coordinate fisheye effect**.
Take a photo with your webcam and follow, **step by step**, exactly what the
poster's algorithm does to each pixel - all the way to the "big head".

Project for the **Image Processing course · ICMC-USP · Extension Fair**.

## Running it

Requirement: [Node.js](https://nodejs.org) 18+ installed.

```bash
npm install     # install dependencies (first time only)
npm run dev     # opens at http://localhost:5173
```

> The webcam only works in a secure context. `localhost` (the `npm run dev`
> server) is already treated as secure by the browser, so it works out of the
> box. Allow camera access when prompted. No camera? Use the **"Send photo"**
> button.

To build the final (static) version:

```bash
npm run build   # generates the dist/ folder
npm run preview # serves the production build locally
```

## How the step-by-step works

The transformation is split into 7 screens. Move with the **◀ ▶** buttons, the
**arrow keys**, by clicking the steps, or use the **Auto tour**.

1. **Original image** - the captured photo.
2. **Center the coordinates** - origin (0,0) moved to the center, scale −1 to +1.
3. **Distance to the center** - heatmap of `sqrt(x² + y²)`.
4. **Angle of each pixel** - color wheel of `arctan2(y, x)`.
5. **The magic** - `distance ** strength`; the photo distorts gradually from 1.0 → 1.8.
6. **Remap** - back to pixel coordinates (`novo_x`, `novo_y`) with `np.clip`.
7. **Final result** - `imagem[novo_y, novo_x]`, with a strength slider to explore.

## Structure

```
src/
├── main.jsx                  # entry point
├── App.jsx                   # layout, capture -> viewer
├── index.css                 # styles
├── lib/fisheye.js            # olho_de_peixe algorithm (identical to the poster) + visualizations
├── data/steps.js             # step script + displayed code
└── components/
    ├── WebcamCapture.jsx      # webcam + file upload
    └── StepViewer.jsx         # step-by-step, animation, and overlays
```

The core is `src/lib/fisheye.js` - a faithful, line-by-line translation of the
poster's Python/NumPy code, running over the pixels of a `<canvas>`.

> Note: the code and on-screen UI are in Portuguese (matching the poster and the
> fair audience). Only this README is in English.
