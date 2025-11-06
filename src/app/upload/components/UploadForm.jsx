"use client";

import { useState } from "react";
import { FaCloudUploadAlt } from "react-icons/fa";

export default function UploadForm() {
	const [fileName, setFileName] = useState(null);

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (file) setFileName(file.name);
	};

	return (
		<div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
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
					placeholder="e.g. ECO 304 - Development Economics Lecture Notes"
					className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
				/>
			</div>

			{/* Short Description */}
			<div className="mb-5">
				<label className="block text-sm font-medium mb-2">
					Short Description
				</label>
				<textarea
					placeholder="Comprehensive lecture notes covering topics from growth theory to sustainable development. Includes 10 past exam solutions."
					rows="3"
					className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
				></textarea>
				<p className="text-xs text-gray-500 mt-1">Character Limit: 250 chars</p>
			</div>

			{/* Upload File */}
			<div className="mb-5">
				<label className="block text-sm font-medium mb-2">
					Upload Your File
				</label>
				<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
					<input
						type="file"
						id="file-upload"
						className="hidden"
						onChange={handleFileChange}
					/>
					<label
						htmlFor="file-upload"
						className="cursor-pointer flex flex-col items-center justify-center"
					>
						<FaCloudUploadAlt className="text-3xl text-blue-500 mb-2" />
						<p className="text-sm text-gray-600 mb-2">
							{fileName ? (
								<span className="font-medium text-gray-800">{fileName}</span>
							) : (
								<>
									Tap to Upload{" "}
									<span className="text-gray-400">
										(.pdf, .docx, .pptx, .zip | 10MB max)
									</span>
								</>
							)}
						</p>
						<button
							type="button"
							className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
						>
							Upload
						</button>
					</label>
				</div>
			</div>

			{/* Price + Usage Rights */}
			<div className="grid sm:grid-cols-2 gap-4 mb-5">
				<div>
					<label className="block text-sm font-medium mb-2">
						Set Your Price (optional)
					</label>
					<input
						type="text"
						placeholder="₦"
						className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium mb-2">Usage Rights</label>
					<select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500">
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
							defaultChecked
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
						className="accent-blue-600"
					/>
					<label htmlFor="private" className="text-gray-700">
						Private — Only you and invited users can access.
					</label>
				</div>
			</div>

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
					className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium"
				>
					Submit & Mint NFT
				</button>
			</div>
		</div>
	);
}
