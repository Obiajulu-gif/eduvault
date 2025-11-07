"use client";

import { useState } from "react";
import { FaCloudUploadAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function UploadForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [usageRights, setUsageRights] = useState("Standard License (download only)");
  const [visibility, setVisibility] = useState("public");

  const [docFile, setDocFile] = useState(null);
  const [docFileName, setDocFileName] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleDocChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocFile(file);
      setDocFileName(file.name);
    }
  };

  const handleThumbChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbFile(file);
      setThumbPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title || !docFile) {
      setError("Title and document file are required.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (docFile) formData.append("file", docFile);
      if (thumbFile) formData.append("thumbnail", thumbFile);

      // Upload files to Vercel Blob
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData?.file?.url) {
        throw new Error(uploadData?.error || "File upload failed");
      }

      const materialPayload = {
        title,
        description,
        price: price ? Number(price) : 0,
        usageRights,
        visibility,
        thumbnailUrl: uploadData?.thumbnail?.url || null,
        fileUrl: uploadData.file.url,
      };

      // Save metadata to DB
      const saveRes = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(materialPayload),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) {
        throw new Error(saveData?.error || "Failed to save material");
      }

      // Redirect to my-materials page
      router.push("/dashboard/my-materials");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
      <h2 className="text-xl font-bold mb-6">Create a New Study Resource</h2>
      <p className="text-sm text-gray-600 mb-8">
        Upload your lecture notes, projects, or past questions — and earn each
        time another student downloads it.
      </p>

      {/* Document Title */}
      <div className="mb-5">
        <label className="block text-sm font-medium mb-2">Document Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. ECO 304 - Development Economics Lecture Notes"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          required
        />
      </div>

      {/* Short Description */}
      <div className="mb-5">
        <label className="block text-sm font-medium mb-2">Short Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Comprehensive lecture notes covering topics from growth theory to sustainable development. Includes 10 past exam solutions."
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">Character Limit: 250 chars</p>
      </div>

      {/* Thumbnail Image */}
      <div className="mb-5">
        <label className="block text-sm font-medium mb-2">Thumbnail Image</label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbChange}
            className="text-sm"
          />
          {thumbPreview && (
            <img src={thumbPreview} alt="Thumbnail Preview" className="w-16 h-16 rounded object-cover border" />
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">Recommended: square image, small size.</p>
      </div>

      {/* Upload File */}
      <div className="mb-5">
        <label className="block text-sm font-medium mb-2">Upload Your File</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleDocChange}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
            <FaCloudUploadAlt className="text-3xl text-blue-500 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              {docFileName ? (
                <span className="font-medium text-gray-800">{docFileName}</span>
              ) : (
                <>
                  Tap to Upload <span className="text-gray-400">(.pdf, .docx, .pptx, .zip | 10MB max)</span>
                </>
              )}
            </p>
            <button type="button" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Choose File
            </button>
          </label>
        </div>
      </div>

      {/* Price + Usage Rights */}
      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-sm font-medium mb-2">Set Your Price (optional)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="celo"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Usage Rights</label>
          <select
            value={usageRights}
            onChange={(e) => setUsageRights(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          >
            <option>Standard License (download only)</option>
            <option>Creative Commons</option>
            <option>Private Use Only</option>
          </select>
        </div>
      </div>

      {/* Visibility */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Visibility</label>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="public"
              name="visibility"
              checked={visibility === "public"}
              onChange={() => setVisibility("public")}
              className="accent-blue-600"
            />
            <label htmlFor="public" className="text-gray-700">
              Public (default) — Anyone can view or download.
            </label>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input
            type="radio"
            id="private"
            name="visibility"
            checked={visibility === "private"}
            onChange={() => setVisibility("private")}
            className="accent-blue-600"
          />
          <label htmlFor="private" className="text-gray-700">
            Private — Only you and invited users can access.
          </label>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Buttons */}
      <div className="flex justify-between gap-4">
        <button
          type="button"
          className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition text-sm font-medium"
        >
          Save As Draft
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit & Mint NFT"}
        </button>
      </div>
    </form>
  );
}
