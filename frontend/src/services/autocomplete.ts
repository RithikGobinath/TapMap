export interface AddressSuggestion {
  id: string;
  description: string;
  source: "google_places" | "fallback";
}

interface PlacesAutocompleteApiResponse {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      text?: {
        text?: string;
      };
    };
  }>;
}

const MADISON_CENTER = { latitude: 43.0731, longitude: -89.4012 };
const MADISON_ADDRESS_FALLBACKS = [
  "2150 Deming Way #1020B, Middleton, WI 53562",
  "2150 Deming Way, Middleton, WI 53562",
  "600 N Park St, Madison, WI 53706",
  "835 W Dayton St, Madison, WI 53706",
  "610 Langdon St, Madison, WI 53703",
  "750 Hilldale Way, Madison, WI 53705",
  "1 S Pinckney St, Madison, WI 53703",
  "100 State St, Madison, WI 53703",
  "702 N Midvale Blvd, Madison, WI 53705",
  "201 W Mifflin St, Madison, WI 53703",
  "702 N Blackhawk Ave, Madison, WI 53705",
  "111 N Broom St, Madison, WI 53703"
];

function fallbackSuggestions(query: string): AddressSuggestion[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];

  return MADISON_ADDRESS_FALLBACKS.filter((candidate) => candidate.toLowerCase().includes(normalized))
    .slice(0, 6)
    .map((description, index) => ({
      id: `fallback-${index}-${description}`,
      description,
      source: "fallback" as const
    }));
}

function parseGoogleSuggestions(payload: PlacesAutocompleteApiResponse): AddressSuggestion[] {
  const out: AddressSuggestion[] = [];
  const suggestions = payload.suggestions ?? [];

  for (const suggestion of suggestions) {
    const placePrediction = suggestion.placePrediction;
    const text = placePrediction?.text?.text?.trim();
    if (!text) continue;

    out.push({
      id: placePrediction?.placeId ?? `google-${text}`,
      description: text,
      source: "google_places"
    });
  }

  return out.slice(0, 6);
}

function mergeUnique(primary: AddressSuggestion[], secondary: AddressSuggestion[]): AddressSuggestion[] {
  const seen = new Set<string>();
  const out: AddressSuggestion[] = [];

  for (const item of [...primary, ...secondary]) {
    const key = item.description.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out.slice(0, 6);
}

export async function fetchAddressSuggestions(
  query: string,
  options?: { signal?: AbortSignal }
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return fallbackSuggestions(trimmed);

  const fallback = fallbackSuggestions(trimmed);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return fallback;

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text"
      },
      body: JSON.stringify({
        input: trimmed,
        languageCode: "en",
        regionCode: "US",
        includedRegionCodes: ["us"],
        locationBias: {
          circle: {
            center: MADISON_CENTER,
            radius: 50000
          }
        }
      }),
      signal: options?.signal
    });

    if (!response.ok) return fallback;

    const payload = (await response.json()) as PlacesAutocompleteApiResponse;
    const googleSuggestions = parseGoogleSuggestions(payload);

    if (googleSuggestions.length === 0) return fallback;
    return mergeUnique(googleSuggestions, fallback);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    return fallback;
  }
}
