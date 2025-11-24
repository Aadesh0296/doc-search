import React from "react";
import ResultCard from "./ResultCard";

export default function ResultsGrid({ results = [] }) {
  if (!results || results.length === 0)
    return (
      <div className="p-6 text-gray-500">
        No results yet — try a search or upload a document.
      </div>
    );
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {results.map((r) => (
        <ResultCard key={r.id} doc={r} />
      ))}
    </div>
  );
}
