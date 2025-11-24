import React, { useState } from "react";
import axios from "axios";

export default function Search({ onResult }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  async function doSearch(e) {
    e && e.preventDefault();
    if (!q) return alert("Enter query");
    setLoading(true);
    try {
      const url = `${
        import.meta.env.VITE_API_BASE || "http://localhost:5001"
      }/api/search?q=${encodeURIComponent(q)}`;
      const r = await axios.get(url);
      onResult && onResult(r.data);
    } catch (err) {
      alert("Search error: " + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3>Search</h3>
      <form onSubmit={doSearch} style={{ display: "flex", gap: 8 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search..."
          style={{ flex: 1, padding: 8 }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "8px 16px" }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>
    </div>
  );
}
