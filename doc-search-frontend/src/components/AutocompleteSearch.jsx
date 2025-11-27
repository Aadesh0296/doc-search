import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

/**
 * AutocompleteSearch
 * Props:
 * - onSearch(query) : callback when user submits (press Enter or click suggestion)
 * - initial : initial text
 */
export default function AutocompleteSearch({ onSearch, initial = "" }) {
  const [q, setQ] = useState(initial);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const abortRef = useRef(null);
  const containerRef = useRef(null);

  // debounce
  useEffect(() => {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const id = setTimeout(() => {
      fetchSuggestions(q);
    }, 180);

    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    function onDocClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  async function fetchSuggestions(q) {
    try {
      if (abortRef.current) abortRef.current.cancel();
      abortRef.current = axios.CancelToken.source();
      const res = await axios.get(
        `${
          import.meta.env.VITE_API_BASE || "http://localhost:5001"
        }/api/search/suggest`,
        {
          params: { q, limit: 8 },
          cancelToken: abortRef.current.token,
        }
      );
      setSuggestions(res.data?.suggestions || []);
      setOpen(true);
      setActiveIndex(-1);
    } catch (err) {
      if (!axios.isCancel(err)) console.error("suggest error", err);
    } finally {
      abortRef.current = null;
    }
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
      setOpen(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = activeIndex >= 0 ? suggestions[activeIndex] : q;
      doSearch(sel);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function doSearch(text) {
    setQ(text);
    setOpen(false);
    setSuggestions([]);
    if (onSearch) onSearch(text);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-3xl">
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (suggestions.length) setOpen(true);
          }}
          placeholder="Search documents, keywords or tags..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="autocomplete-listbox"
        />
        <button
          className="px-3 py-2 bg-accent text-white rounded"
          onClick={() => doSearch(q)}
        >
          Search
        </button>
      </div>

      {/* suggestions dropdown */}
      {open && suggestions && suggestions.length > 0 && (
        <ul
          id="autocomplete-listbox"
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border rounded shadow"
          style={{ maxHeight: 280, overflow: "auto" }}
        >
          {suggestions.map((s, i) => {
            const active = i === activeIndex;
            return (
              <li
                key={s + "-" + i}
                role="option"
                aria-selected={active}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(-1)}
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  doSearch(s);
                }} // use mouseDown to avoid losing focus before click
                className={`px-3 py-2 cursor-pointer ${
                  active ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
              >
                <strong>{s}</strong>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
