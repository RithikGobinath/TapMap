import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { fetchAddressSuggestions, type AddressSuggestion } from "../services/autocomplete";

type ThemeMode = "dark" | "light";

interface AddressAutocompleteSearchProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (address: string) => Promise<void> | void;
  isSubmitting: boolean;
  disabled?: boolean;
  theme?: ThemeMode;
}

export function AddressAutocompleteSearch({
  value,
  onValueChange,
  onSubmit,
  isSubmitting,
  disabled = false,
  theme = "dark"
}: AddressAutocompleteSearchProps): JSX.Element {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const lookupRef = useRef(0);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setActiveIndex(-1);
      setLookupError(null);
      setIsOpen(false);
      return;
    }

    const requestId = lookupRef.current + 1;
    lookupRef.current = requestId;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLookupLoading(true);
      setLookupError(null);
      try {
        const nextSuggestions = await fetchAddressSuggestions(query, { signal: controller.signal });
        if (requestId !== lookupRef.current) return;
        setSuggestions(nextSuggestions);
        setActiveIndex(nextSuggestions.length > 0 ? 0 : -1);
        setIsOpen(nextSuggestions.length > 0);
      } catch (error) {
        if (requestId !== lookupRef.current) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLookupError("Autocomplete lookup failed. You can still submit the full address.");
        setSuggestions([]);
        setActiveIndex(-1);
        setIsOpen(false);
      } finally {
        if (requestId === lookupRef.current) {
          setLookupLoading(false);
        }
      }
    }, 260);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  function selectSuggestion(item: AddressSuggestion): void {
    onValueChange(item.description);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (disabled || isSubmitting) return;

    const chosen =
      activeIndex >= 0 && isOpen && suggestions[activeIndex]
        ? suggestions[activeIndex].description
        : value.trim();
    if (!chosen) return;

    onValueChange(chosen);
    setIsOpen(false);
    await onSubmit(chosen);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (!isOpen || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  const isLight = theme === "light";
  const inputClass = isLight
    ? "w-full rounded-xl border border-slate-300 bg-white/95 px-2.5 py-2 text-sm text-slate-800 outline-none backdrop-blur focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60"
    : "w-full rounded-xl border border-slate-700/70 bg-slate-950/80 px-2.5 py-2 text-sm text-slate-100 outline-none backdrop-blur focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40 disabled:cursor-not-allowed disabled:opacity-60";
  const dropdownClass = isLight
    ? "absolute z-[10000] mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-300 bg-white/95 p-1 text-sm shadow-2xl"
    : "absolute z-[10000] mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-700 bg-slate-950/95 p-1 text-sm shadow-2xl";
  const buttonClass = isLight
    ? "rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:from-sky-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
    : "rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:from-cyan-400 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-70";

  return (
    <form onSubmit={handleFormSubmit} className="relative z-[240] grid gap-2 md:grid-cols-[1fr_auto]">
      <div className="relative">
        <input
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(suggestions.length > 0)}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
          placeholder="Enter Address"
          autoComplete="off"
          disabled={disabled || isSubmitting}
          className={inputClass}
        />

        {isOpen && suggestions.length > 0 ? (
          <ul className={dropdownClass}>
            {suggestions.map((suggestion, index) => {
              const active = index === activeIndex;
              return (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    className={`block w-full rounded-lg px-2 py-1.5 text-left ${
                      active
                        ? isLight
                          ? "bg-sky-100 text-sky-900"
                          : "bg-sky-500/20 text-sky-100"
                        : isLight
                          ? "text-slate-700 hover:bg-slate-100"
                          : "text-slate-200 hover:bg-slate-800/80"
                    }`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    {suggestion.description}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={disabled || isSubmitting}
        className={buttonClass}
      >
        {isSubmitting ? "Scoring..." : "Check Water"}
      </button>

      <div className="md:col-span-2">
        {lookupLoading ? <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Loading suggestions...</p> : null}
        {lookupError ? <p className={`text-xs ${isLight ? "text-amber-700" : "text-amber-300"}`}>{lookupError}</p> : null}
      </div>
    </form>
  );
}
