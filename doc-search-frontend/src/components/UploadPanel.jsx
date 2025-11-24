import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

export default function UploadPanel({ onUpload }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);

  function handleFiles(files) {
    const f = files[0];
    if (!f) return;
    onUpload && onUpload(f);
  }

  return (
    <div>
      <div
        ref={ref}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`border-2 ${
          drag ? "border-accent bg-accent/5" : "border-dashed border-gray-200"
        } rounded-xl p-6 text-center cursor-pointer`}
        onClick={() => ref.current.querySelector("input")?.click()}
      >
        <input
          type="file"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-sm text-gray-600">
            Drop file here or click to upload
          </div>
          <div className="mt-3 text-xs text-gray-400">
            Max 50MB • PDF, DOCX, PPTX, TXT
          </div>
        </motion.div>
      </div>
    </div>
  );
}
