import React from "react";
import { motion } from "framer-motion";

export default function ResultCard({ doc }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="bg-gray-50 p-4 rounded-xl border"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-gray-500">Document</div>
          <div className="text-lg font-semibold text-gray-800">
            {doc.filename}
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {doc.uploadedAt?.split("T")[0]}
        </div>
      </div>
      <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">
        {doc.snippet}
      </p>
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {(doc.tags || []).slice(0, 6).map((t) => (
          <span
            key={t}
            className="text-xs bg-white px-2 py-1 rounded-md border text-gray-600"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <a
          className="text-sm text-accent hover:underline"
          href={
            doc.downloadUrl.startsWith("/")
              ? `http://localhost:5001${doc.downloadUrl}`
              : doc.downloadUrl
          }
          target="_blank"
          rel="noreferrer"
        >
          Download
        </a>
        <div className="text-xs text-gray-400">
          Size: {Math.round((doc.size || 0) / 1024)} KB
        </div>
      </div>
    </motion.div>
  );
}