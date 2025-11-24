import React, { useState } from "react";
import { Search } from "lucide-react";

export default function SearchBar({ onSearch, loading }) {
  const [q, setQ] = useState("");
  function submit(e) {
    e.preventDefault();
    if (!q.trim()) return;
    onSearch(q.trim());
  }
  return (
    <form onSubmit={submit} className="mt-4 flex gap-3">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search across documents, e.g. 'neural network'"
            className="pl-10 pr-4 py-3 w-full rounded-xl border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>
      <button
        className="bg-accent px-5 rounded-xl text-white font-medium hover:bg-indigo-600"
        disabled={loading}
      >
        {loading ? "Searching..." : "Search"}
      </button>
    </form>
  );
}
