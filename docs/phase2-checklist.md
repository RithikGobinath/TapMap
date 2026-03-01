# Phase 2 Checklist (You)

## Completed in this repo
- [x] Build Leaflet map component with well service area overlays (GeoJSON).
- [x] Color-code well zones by risk level (green -> red gradient).
- [x] Add click-on-zone popups showing well ID, contaminants, and last test date.
- [x] Integrate Google geocoding flow: address -> lat/lng -> matched well zone.
- [x] Add dedicated Phase 2 route/page (`/phase-2`) and navigation entry.
- [x] Add phase-2 frontend data wiring for service areas + PFAS metrics.

## Manual verification still required by you
- [x] Run backend locally (`5001`) and frontend locally (`5173`) at the same time.
- [x] Open `http://localhost:5173/phase-2` and verify map tiles and zone overlays render.
- [x] Search at least 3 Madison addresses and confirm geocode -> zone selection works.
- [x] Click at least 3 zones and verify popup contents (well ID, PFAS values, sample date).
- [x] Confirm error handling for invalid/empty address input.
- [x] Capture screenshots for phase report evidence (map, selected zone, search result).

## Done criteria for your Phase 2 duties
- [x] Address lookup consistently selects a matching zone when data exists.
- [x] Zone styling updates reflect risk-color mapping.
- [x] Popup details align with loaded dataset values.
- [x] No blocking frontend runtime errors in browser console during happy-path flow.
