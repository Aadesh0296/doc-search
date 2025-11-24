import React from "react";
import { ArrowRight } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-bold">
            DS
          </div>
          <div>
            <div className="text-lg font-semibold">DocSearch</div>
            <div className="text-xs text-gray-500">
              Document-first Knowledge Graph Search
            </div>
          </div>
        </div>
        <nav className="flex items-center gap-4">
          <a className="text-sm text-gray-600 hover:text-accent transition">
            Docs
          </a>
          <a className="text-sm text-gray-600 hover:text-accent transition">
            API
          </a>
          <button className="ml-2 inline-flex items-center gap-2 bg-accent hover:bg-indigo-600 text-white px-4 py-2 rounded-md transition">
            Try it <ArrowRight size={14} />
          </button>
        </nav>
      </div>
    </header>
  );
}
