import React, { useState } from "react";
import axios from "axios";

export default function Upload({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!file) return alert("Pick file");
    setStatus("Uploading...");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await axios.post(
        `${
          import.meta.env.VITE_API_BASE || "http://localhost:5001"
        }/api/files/upload`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setStatus("Uploaded: " + res.data.filename);
      onUploaded && onUploaded(res.data);
    } catch (err) {
      setStatus("Error: " + (err.response?.data || err.message));
    }
  }

  return (
    <div>
      <h3>Upload</h3>
      <form onSubmit={submit}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit" style={{ marginLeft: 8 }}>
          Upload
        </button>
      </form>
      <div>{status}</div>
    </div>
  );
}
