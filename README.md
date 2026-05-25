# Mermaid Graph

Mermaid Graph is a browser-based Mermaid diagram workspace built with React, TypeScript, and Vite. It combines a live Mermaid preview, Monaco code editing, a flowchart-focused visual editor, local project storage, and export tools for `.mmd`, SVG, and PNG files.

## Features

- Live Mermaid rendering with parse errors shown in the preview panel.
- Project list with local IndexedDB persistence through Dexie.
- Monaco-powered code editor for any Mermaid diagram type.
- Visual flowchart editor based on React Flow, with node and edge editing.
- Automatic flowchart layout through ELK.
- Export current diagram code, SVG, or high-resolution PNG.
- Light, paper, and dark preview themes.

## Tech Stack

- React 19
- TypeScript
- Vite
- Mermaid
- Monaco Editor
- React Flow
- Dexie
- ELK

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Getting Started

```bash
npm install
npm run dev
```

The development server starts with Vite. Open the printed local URL in your browser.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Project Structure

```text
src/
  components/   React UI components for preview, editing, and project navigation
  lib/          Mermaid parsing/rendering, layout, export, and storage helpers
  App.tsx       Application state and workspace composition
  styles.css    Application styling
```

## GitHub Upload Checklist

Before uploading this project to GitHub, commit the source files, `package.json`, `package-lock.json`, `README.md`, `LICENSE`, and `.gitignore`.

Do not commit `node_modules/`, `dist/`, `.DS_Store`, or local environment files. They are ignored by `.gitignore`.

## License

This project uses the MIT License.
