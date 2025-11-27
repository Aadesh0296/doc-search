// frontend/src/components/PreviewModal.jsx
import React, { useEffect, useState } from "react";
import { Document, Page } from "react-pdf";
import DOMPurify from "dompurify";
import mammoth from "mammoth";
import { pdfjs } from "react-pdf";
// console.log("pdfjs.runtime version:", pdfjs.version);
//console.log("pdfjs.GlobalWorkerOptions:", pdfjs.GlobalWorkerOptions);

// Use the local, same-version worker we copied into public/;
pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`;

// Point PDF.js to the worker URL returned by Vite
// pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;


export default function PreviewModal({
  open,
  onClose,
  fileUrl,
  filename,
  textFallback,
}) {
  const [fileExt, setFileExt] = useState("");
  const [numPages, setNumPages] = useState(null);
  const [docBuffer, setDocBuffer] = useState(null);
  const [docHtml, setDocHtml] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFileExt(filename?.split(".").pop()?.toLowerCase() || "");
    setNumPages(null);
    setDocBuffer(null);
    setDocHtml("");
    if (!fileUrl) return;
    setLoading(true);

    // fetch the file as array buffer for pdf/docx rendering
    fetch(fileUrl)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to fetch file");
        const ab = await r.arrayBuffer();
        setDocBuffer(ab);
        return ab;
      })
      .then((ab) => {
        if (fileExt === "docx" || filename.toLowerCase().endsWith(".docx")) {
          // convert docx to HTML using mammoth
          mammoth
            .convertToHtml({ arrayBuffer: ab })
            .then((res) => {
              setDocHtml(res.value || "<div>No content</div>");
            })
            .catch((err) => {
              setDocHtml("<div>Cannot parse DOCX preview</div>");
              console.error(err);
            })
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("preview fetch error", err);
        setLoading(false);
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fileUrl, filename, fileExt]);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6 bg-black/50">
      <div className="w-full max-w-5xl h-[85vh] bg-white rounded-xl overflow-auto shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="text-lg font-semibold">{filename || "Preview"}</div>
          <div className="flex items-center gap-3">
            <button className="text-sm text-gray-600" onClick={onClose}>
              Close
            </button>
            <a
              className="text-sm text-accent"
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open in new tab
            </a>
          </div>
        </div>

        <div className="p-4">
          {loading && <div>Loading preview…</div>}

          {fileExt === "pdf" && docBuffer && (
            <div>
              <Document
                file={docBuffer}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div>Loading PDF…</div>}
              >
                {/* render first page and allow navigation */}
                <Page pageNumber={1} width={900} />
                <div className="mt-3 text-sm text-gray-500">
                  Page 1 of {numPages || "?"}
                </div>
              </Document>
            </div>
          )}

          {fileExt === "docx" && (
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(docHtml) }}
            />
          )}

          {fileExt === "pptx" && (
            <div>
              <div className="text-sm text-gray-600 mb-3">
                Presentation preview is not available yet. You can download or
                view extracted text below.
              </div>
              <div className="p-3 bg-gray-50 rounded">
                {textFallback || "No extracted text available."}
              </div>
            </div>
          )}

          {["txt", "md"].includes(fileExt) && (
            <pre className="whitespace-pre-wrap p-3 bg-gray-50 rounded text-sm">
              {textFallback}
            </pre>
          )}

          {!["pdf", "docx", "pptx", "txt", "md"].includes(fileExt) && (
            <div>
              <div className="text-sm text-gray-600">
                Preview not supported for this file type.
              </div>
              <div className="mt-3">
                <a
                  className="text-accent"
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open / Download
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
