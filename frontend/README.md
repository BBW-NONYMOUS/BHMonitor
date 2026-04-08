# Frontend (React + Vite)

React frontend for the SUDO BH application.

## Requirements

- Node.js 18+
- npm or yarn

## Setup

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

API calls are proxied to `http://localhost:8000/api` (make sure backend is running).

## Build

```bash
npm run build
```

## Dependency Check

```bash
npm run check:deps
```

Use this after adding new UI libraries or components. It scans `src/` for third-party imports that are not declared in `package.json`.

## Preview Production Build

```bash
npm run preview
```
