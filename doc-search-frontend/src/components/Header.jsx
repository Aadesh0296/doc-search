import React from "react";
import { Github, Linkedin } from "lucide-react";
import app_logo from "../assets/app_logo.png";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* LEFT — LOGO + TITLE */}
        <div className="flex items-center gap-3 cursor-pointer">
          <img
            src={app_logo}
            alt="DocSearch Logo"
            className="w-10 h-10 object-contain"
          />

          <div>
            <div className="text-xl font-semibold tracking-tight">
              DocSearch
            </div>
            <div className="text-xs text-gray-500 -mt-1">
              Knowledge Graph Semantic Search Engine
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#"
            className="text-sm text-gray-600 hover:text-accent transition font-medium"
          >
            Docs
          </a>

          <a
            href="http://localhost:5001/swagger-ui/index.html"
            target="_blank"
            className="text-sm text-gray-600 hover:text-accent transition font-medium"
          >
            API
          </a>

          <a
            href="https://github.com/Aadesh0296/doc-search"
            target="_blank"
            className="text-sm text-gray-600 hover:text-accent transition font-medium flex items-center gap-1"
          >
            <Github size={16} /> GitHub
          </a>

          <a
            href="https://www.linkedin.com/in/aadesh0296/"
            target="_blank"
            className="inline-flex items-center gap-2 bg-[#0077B5] text-white px-4 py-2 rounded-lg transition shadow-sm hover:bg-[#0a66c2]"
          >
            <Linkedin size={14} /> LinkedIn
          </a>
        </nav>

        {/* MOBILE MENU ICON */}
        <div className="md:hidden">
          <button className="p-2 rounded-lg border hover:bg-gray-100 transition">
            <span className="block w-5 h-[2px] bg-gray-700 mb-1"></span>
            <span className="block w-5 h-[2px] bg-gray-700 mb-1"></span>
            <span className="block w-5 h-[2px] bg-gray-700"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
