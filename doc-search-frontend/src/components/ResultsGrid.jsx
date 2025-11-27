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
    <div
      className={`grid gap-4 mt-4
    ${results.length === 1 ? "grid-cols-1 justify-center" : ""}
    ${results.length === 2 ? "grid-cols-2" : ""}
    ${results.length >= 3 ? "grid-cols-2" : ""}
  `}
    >
      {results.map((r) => (
        <ResultCard key={r.id} doc={r} className="w-full" />
      ))}
    </div>
  );
}
