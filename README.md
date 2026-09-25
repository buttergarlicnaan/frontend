# GeoEnhance Frontend

Interactive map dashboard for the GeoEnhance SIH project.

This app lets you search a location, draw a rectangle on the map, and walk through a simulated enhancement flow. Copernicus satellite fetch and the ML model are not connected yet.

## Stack

- React
- Vite
- JavaScript
- Leaflet
- React-Leaflet

The frontend is a separate repository from the backend. Do not mix the two.

## Run locally

```bash
npm install
npm run dev
```

The app starts at `http://localhost:5173`.

The backend (Express) is expected at `http://localhost:8000`. Copy `.env.example` to `.env` if you need a different API origin:

```
VITE_API_BASE_URL=http://localhost:8000
```

Frontend environment variables are public at build time. Never put secrets here.

## Scripts

```bash
npm run dev      # local development
npm run build    # production build
npm run preview  # preview the production build
npm run lint     # Oxlint
```

## API access

All backend HTTP calls go through `src/api/client.js`. Do not hardcode backend URLs in components.

The enhancement API is not implemented yet.
