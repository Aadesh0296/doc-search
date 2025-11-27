// frontend/src/components/ResultCard.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import DOMPurify from "dompurify";
import PreviewModal from "./PreviewModal";

export default function ResultCard({ doc }) {
  const [openPreview, setOpenPreview] = useState(false);

  // prepare snippet/html same as before
  const htmlSnippet = (() => {
    if (Array.isArray(doc.highlights) && doc.highlights.length > 0) {
      return doc.highlights.slice(0, 3).join(" ... ");
    }
    return doc.snippet || "";
  })();

  const sanitized = DOMPurify.sanitize(htmlSnippet, {
    USE_PROFILES: { html: true },
  });

  // compute preview URL — use inline preview endpoint
  // doc.downloadUrl is like "/api/files/download/<filename>"
  // convert to preview path and add inline=true
  const previewUrl = (() => {
    if (!doc.downloadUrl) return null;
    // replace /download/ with /preview/ and ensure inline true
    if (doc.downloadUrl.includes("/api/files/download/")) {
      const fn = doc.downloadUrl.split("/api/files/download/")[1];
      return `http://localhost:5001/api/files/preview/${fn}?inline=true`;
    }
    // fallback direct URL
    return doc.downloadUrl;
  })();

  return (
    <>
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

        <div
          className="mt-3 text-sm text-gray-700"
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {(doc.tags || []).slice(0, 10).map((t) => (
            <span
              key={t}
              className="text-xs bg-white px-2 py-1 rounded-md border text-gray-600"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-3 items-center">
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
            {/* <button
              className="text-sm text-gray-700 hover:text-accent"
              onClick={() => setOpenPreview(true)}
            >
              Preview
            </button> */}
          </div>
          <div className="text-xs text-gray-400">
            Size: {Math.round((doc.size || 0) / 1024)} KB
          </div>
        </div>
      </motion.div>

      {/* {openPreview && (
        <PreviewModal
          open={openPreview}
          onClose={() => setOpenPreview(false)}
          fileUrl={previewUrl}
          filename={doc.filename}
          textFallback={doc.snippet}
        />
      )} */}
    </>
  );
}
