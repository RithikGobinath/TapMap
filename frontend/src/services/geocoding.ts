import type { GeocodedPoint } from "../types/phase2";

interface PlacesTextSearchResponse {
  places?: Array<{
    formattedAddress?: string;
    location?: {
      latitude?: number;
      longitude?: number;
    };
  }>;
  error?: {
    message?: string;
  };
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
    // Use Places Text Search for browser-safe geocoding with referrer-restricted API keys.
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.formattedAddress,places.location"
      },
      body: JSON.stringify({
        textQuery: address,
        languageCode: "en",
        regionCode: "US"
      }),
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`Geocoding request failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as PlacesTextSearchResponse;
    const first = payload.places?.[0];
    const lat = first?.location?.latitude;
    const lng = first?.location?.longitude;
    const formattedAddress = first?.formattedAddress?.trim();

    if (!first || lat == null || lng == null || !formattedAddress) {
      throw new Error(payload.error?.message || "No matching address found.");
    }

    return {
      formattedAddress,
      lat,
      lng
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
