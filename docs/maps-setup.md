# QueueCut — Maps & Location Architecture Guide

QueueCut uses **MapLibre React Native** with legitimate, free-tier OpenStreetMap-compatible vector tile providers to display interactive discovery maps.

---

## 1. Selected Tile Provider

QueueCut uses **OpenFreeMap** (`https://tiles.openfreemap.org/styles/bright`), a fast, open-source vector map service built directly on OpenStreetMap data:
- Completely free with open usage policies for development and showcases.
- No restrictive credit card or Google Places billing required.
- Full high-DPI rendering for Kanpur and Indian cities.

### Alternative Providers

You can configure alternative tile styles in `apps/mobile/.env` or `apps/mobile/src/screens/customer/DiscoveryMapScreen.tsx`:

- **MapTiler**: `https://api.maptiler.com/maps/streets-v2/style.json?key=YOUR_MAPTILER_KEY` (Free tier: 100,000 tile requests/month)
- **Stadia Maps**: `https://tiles.stadiamaps.com/styles/alidade_smooth.json?api_key=YOUR_KEY` (Free tier: 200,000 credits/month)
- **Carto**: `https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json`

---

## 2. Fallback Mechanism

If device network conditions cause vector tiles to fail to load, QueueCut automatically provides:
1. An inline simulation view displaying user location pin and nearby salon markers.
2. A **Map / List View Toggle** button in the header allowing immediate switching to the sorted distance list view without blocking discovery.
