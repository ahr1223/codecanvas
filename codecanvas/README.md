# CodeCanvas — React Web Playground

A polished HTML, CSS, and JavaScript playground built with React and Vite, styled with a restrained GitHub Dark-inspired palette, native system typography, and minimal status chrome.

## Features

- Syntax-highlighted HTML, CSS, and JavaScript editor powered by Monaco Editor
- Live website preview in an isolated sandboxed iframe
- Desktop, tablet, and mobile preview widths
- Captured `console.log`, `console.info`, `console.warn`, `console.error`, `console.debug`, `console.table`, runtime errors, and unhandled promise rejections
- Add more CSS and JavaScript files; all virtual CSS and JS files are bundled into the preview
- Debounced autosave to browser `localStorage`
- Shareable URL snapshots (project source is encoded in the URL fragment; no backend required)
- Download the project source as a ZIP archive
- Search file names, refresh preview, and open preview in a separate tab
- Responsive layout, system-font fallback, and reduced-motion support

## Requirements

- Node.js 18 or newer (Node.js 20+ recommended)
- npm

## Run locally

1. Extract the ZIP file.
2. Open a terminal in the extracted `codecanvas` folder (the folder containing `package.json`).
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL printed by Vite, usually `http://localhost:5173`.

## Other commands

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Notes and limitations

- Autosave is local to the current browser and device. Use **Share** to send a snapshot to someone else, or **Export ZIP** to keep a local copy.
- Share URLs contain the full project source in the URL fragment. Very large projects can create long links, and anyone with the link can read the source.
- Preview code runs in a sandboxed iframe without same-origin privileges. This helps isolate project code, but some browser APIs, imports, external resources, and cross-origin requests may behave differently from a full local development server.
- The current preview combines all virtual CSS files and JavaScript files in file-list order. `index.html` is the entry point. Additional HTML files are not supported in the preview file tree.
- ZIP export includes the individual source files as edited. If the project uses module imports or fetches local resources, open it through a local server rather than directly as a `file://` page.
- The app and starter page use system fonts, so no external font download is required.

## Tech stack

React, Vite, Monaco Editor, Lucide React, and JSZip.
