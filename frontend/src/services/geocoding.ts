import type { GeocodedPoint } from "../types/phase2";

interface GeocodingApiResponse {
  status: string;
  error_message?: string;
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
}

export async function geocodeAddress(address: string): Promise<GeocodedPoint> {
  if (!address.trim()) {
    throw new Error("Please enter an address.");
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Google Maps API key in frontend/.env");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString(), { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Geocoding request failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as GeocodingApiResponse;

    if (payload.status !== "OK" || payload.results.length === 0) {
      throw new Error(payload.error_message || `Geocoding failed: ${payload.status}`);
    }

    const first = payload.results[0];

    return {
      formattedAddress: first.formatted_address,
      lat: first.geometry.location.lat,
      lng: first.geometry.location.lng
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Geocoding timed out. Please retry.");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Geocoding failed unexpectedly.");
  } finally {
    clearTimeout(timeout);
  }
}
