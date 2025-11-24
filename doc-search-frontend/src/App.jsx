import React, { useState } from "react";
import Header from "./components/Header";
import UploadPanel from "./components/UploadPanel";
import SearchBar from "./components/SearchBar";
import ResultsGrid from "./components/ResultsGrid";
import GraphView from "./components/GraphView";
import axios from "axios";

export default function App() {
  const [results, setResults] = useState([]);
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(q) {
    setLoading(true);
    try {
      const res = await axios.get(
        `${
          import.meta.env.VITE_API_BASE || "http://localhost:5001"
        }/api/search?q=${encodeURIComponent(q)}&size=20`
      );
      setResults(res.data.results || []);
      setGraph(res.data.graph || null);
    } catch (e) {
      alert("Search failed: " + (e.response?.data || e.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(file) {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await axios.post(
        `${
          import.meta.env.VITE_API_BASE || "http://localhost:5001"
        }/api/files/upload`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      // optimistic: insert uploaded doc at top
      setResults((prev) => [res.data, ...prev]);
      alert("Uploaded: " + res.data.filename);
    } catch (e) {
      alert("Upload failed: " + (e.response?.data || e.message));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white shadow-md rounded-2xl p-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Search Documents
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Full-text search + knowledge graph visualization
              </p>

              <div className="mt-6">
                <SearchBar onSearch={handleSearch} loading={loading} />
              </div>

              <div className="mt-6">
                <ResultsGrid results={results} />
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-white shadow-md rounded-2xl p-6">
              <h3 className="text-lg font-medium">Upload</h3>
              <p className="text-sm text-gray-500 mt-1">
                Drop a file or click to select. Supports PDF, DOCX, PPTX, TXT.
              </p>
              <div className="mt-4">
                <UploadPanel onUpload={handleUpload} />
              </div>
            </div>

            <div className="bg-white shadow-md rounded-2xl p-4">
              <h3 className="text-lg font-medium">Graph Preview</h3>
              <p className="text-sm text-gray-500 mt-1">
                Top keywords + document relationships
              </p>
              <div className="mt-3 h-64">
                <GraphView graph={graph} />
              </div>
            </div>

            <div className="bg-gradient-to-r from-accent to-indigo-500 text-white rounded-2xl p-4">
              <h4 className="font-semibold">Tip</h4>
              <p className="text-sm opacity-90 mt-1">
                Use phrases like "machine learning" to get better multi-word
                matches. Try uploading your PDF and search instantly.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}