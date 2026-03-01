import type { AddressWellLookupResponse, ScoreResponse, WellsResponse } from "../types/phase2";

function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (!raw) {
    return "http://localhost:5001";
  }
  return raw.replace(/\/+$/, "");
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message: string | null = null;
    try {
      const body = (await response.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      // No-op: keep default message.
    }
    if (response.status === 400 && message) {
      throw new Error(message);
    }
    if (message) {
      throw new Error(`API request failed (${response.status}). ${message}`);
    }
    throw new Error(`API request failed (${response.status}).`);
  }
  return (await response.json()) as T;
}

export async function fetchWells(): Promise<WellsResponse> {
  const url = `${getApiBaseUrl()}/api/wells`;
  const response = await fetch(url);
  return parseJson<WellsResponse>(response);
}

export async function fetchScore(lat: number, lng: number): Promise<ScoreResponse> {
  const url = `${getApiBaseUrl()}/api/score`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lng })
  });
  return parseJson<ScoreResponse>(response);
}

export async function fetchScoreByWells(
  wellIds: string[],
  wellWeights: Record<string, number>,
  zoneId?: string
): Promise<ScoreResponse> {
  const url = `${getApiBaseUrl()}/api/score`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wellIds, wellWeights, zoneId }),
  });
  return parseJson<ScoreResponse>(response);
}

export async function fetchAddressWells(address: string): Promise<AddressWellLookupResponse> {
  const url = `${getApiBaseUrl()}/api/address-wells`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  return parseJson<AddressWellLookupResponse>(response);
}
