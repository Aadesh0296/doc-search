// import React, { useState } from "react";
// import { Search } from "lucide-react";

// export default function SearchBar({ onSearch, loading }) {
//   const [q, setQ] = useState("");
//   function submit(e) {
//     e.preventDefault();
//     if (!q.trim()) return;
//     onSearch(q.trim());
//   }
//   return (
//     <form onSubmit={submit} className="mt-4 flex gap-3">
//       <div className="flex-1">
//         <div className="relative">
//           <Search className="absolute left-3 top-3 text-gray-400" />
//           <input
//             value={q}
//             onChange={(e) => setQ(e.target.value)}
//             placeholder="Search across documents, e.g. 'neural network'"
//             className="pl-10 pr-4 py-3 w-full rounded-xl border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent"
//           />
//         </div>
//       </div>
//       <button
//         className="bg-accent px-5 rounded-xl text-white font-medium hover:bg-indigo-600"
//         disabled={loading}
//       >
//         {loading ? "Searching..." : "Search"}
//       </button>
//     </form>
//   );
// }


import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import axios from "axios";

/**
 * SearchBar with autocomplete suggestions.
 * Props:
 *  - onSearch(q) : called when user submits or selects suggestion
 *  - loading : boolean to disable search button while loading
 */
export default function SearchBar({ onSearch, loading }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const abortRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Debounce fetching suggestions
  useEffect(() => {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(() => fetchSuggestions(q), 160);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function fetchSuggestions(text) {
    try {
      if (abortRef.current) abortRef.current.cancel();
      abortRef.current = axios.CancelToken.source();
      const base = import.meta.env.VITE_API_BASE || "http://localhost:5001";
      const res = await axios.get(`${base}/api/search/suggest`, {
        params: { q: text, limit: 8 },
        cancelToken: abortRef.current.token,
        timeout: 3000,
      });
      setSuggestions(res.data?.suggestions || []);
      setOpen(true);
      setActiveIndex(-1);
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error("suggest error", err);
      }
    } finally {
      abortRef.current = null;
    }
  }

  function submit(e) {
    e?.preventDefault();
    const value = q.trim();
    if (!value) return;
    setOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
    if (onSearch) onSearch(value);
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
      if (sel) {
        setQ(sel);
        submit();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function pickSuggestion(s) {
    setQ(s);
    setOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
    if (onSearch) onSearch(s);
  }

  return (
    <div ref={containerRef} className="mt-4 relative">
      <form onSubmit={submit} className="flex gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => {
                if (suggestions.length) setOpen(true);
              }}
              placeholder="Search across documents, e.g. 'neural network'"
              className="pl-10 pr-4 py-3 w-full rounded-xl border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent"
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls="search-suggestions"
              aria-activedescendant={
                activeIndex >= 0 ? `sugg-${activeIndex}` : undefined
              }
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-accent px-5 rounded-xl text-white font-medium hover:bg-indigo-600"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* suggestions dropdown */}
      {open && suggestions && suggestions.length > 0 && (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-2 bg-white border rounded shadow max-h-72 overflow-auto"
        >
          {suggestions.map((s, i) => {
            const active = i === activeIndex;
            return (
              <li
                id={`sugg-${i}`}
                key={s + "-" + i}
                role="option"
                aria-selected={active}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(-1)}
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  pickSuggestion(s);
                }}
                className={`px-4 py-2 cursor-pointer flex items-center gap-3 ${
                  active ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
              >
                <span className="text-sm break-words">{s}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}