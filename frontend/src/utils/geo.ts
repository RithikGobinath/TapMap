import type { WellServiceAreaFeature, WellServiceAreasGeoJson } from "../types/phase2";

function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];

    const intersects = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

function isInPolygon(lng: number, lat: number, polygonCoords: number[][][]): boolean {
  return polygonCoords.some((ring) => pointInRing(lng, lat, ring));
}

function isInMultiPolygon(lng: number, lat: number, multiPolygonCoords: number[][][][]): boolean {
  return multiPolygonCoords.some((polygon) => isInPolygon(lng, lat, polygon));
}

export function findZoneByPoint(
  geojson: WellServiceAreasGeoJson,
  lat: number,
  lng: number
): WellServiceAreaFeature | null {
  for (const feature of geojson.features) {
    if (feature.geometry.type === "Polygon") {
      if (isInPolygon(lng, lat, feature.geometry.coordinates)) {
        return feature;
      }
    } else if (feature.geometry.type === "MultiPolygon") {
      if (isInMultiPolygon(lng, lat, feature.geometry.coordinates)) {
        return feature;
      }
    }
  }

  return null;
}

export function computeFeatureCenter(feature: WellServiceAreaFeature): { lat: number; lng: number } {
  const points: number[][] = [];

  if (feature.geometry.type === "Polygon") {
    feature.geometry.coordinates.forEach((ring) => ring.forEach((point) => points.push(point)));
  } else {
    feature.geometry.coordinates.forEach((poly) => poly.forEach((ring) => ring.forEach((point) => points.push(point))));
  }

  const [sumLng, sumLat] = points.reduce(
    (acc, point) => {
      acc[0] += point[0];
      acc[1] += point[1];
      return acc;
    },
    [0, 0]
  );

  return {
    lat: sumLat / points.length,
    lng: sumLng / points.length
  };
}
