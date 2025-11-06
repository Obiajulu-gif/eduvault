"use client";

import UploadForm from "./components/UploadForm";

export default function UploadPage() {
	return (
		<div className="min-h-screen bg-gray-50 text-gray-900">
			<div className="max-w-7xl mx-auto py-10 px-6 grid md:grid-cols-3 gap-8">
				{/* Left side: Upload form */}
				<div className="md:col-span-2">
					<UploadForm />
				</div>

				{/* Right side: Steps */}
				<aside className="bg-white border border-gray-200 rounded-xl p-6 h-fit">
					<h3 className="text-lg font-semibold mb-6">Upload Material Page</h3>
					<ol className="space-y-4">
						<li className="flex items-start gap-3">
							<span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
								1
							</span>
							<p className="text-sm text-gray-700">
								It’s free to upload. Pay a small gas fee for minting.
							</p>
						</li>
						<li className="flex items-start gap-3 opacity-50">
							<span className="flex-shrink-0 w-6 h-6 border border-gray-300 rounded-full flex items-center justify-center text-sm font-semibold">
								2
							</span>
							<p className="text-sm text-gray-700">
								Review and Confirm Details
							</p>
						</li>
						<li className="flex items-start gap-3 opacity-50">
							<span className="flex-shrink-0 w-6 h-6 border border-gray-300 rounded-full flex items-center justify-center text-sm font-semibold">
								3
							</span>
							<p className="text-sm text-gray-700">Mint NFT via wallet</p>
						</li>
						<li className="flex items-start gap-3 opacity-50">
							<span className="flex-shrink-0 w-6 h-6 border border-gray-300 rounded-full flex items-center justify-center text-sm font-semibold">
								4
							</span>
							<p className="text-sm text-gray-700">Success confirmation</p>
						</li>
					</ol>

					{/* Help section */}
					<div className="mt-10 border-t border-gray-100 pt-6">
						<h4 className="text-sm font-semibold mb-2">Need Help?</h4>
						<p className="text-sm text-gray-600 mb-4">
							Get to know how your campaign can reach a wider audience.
						</p>
						<button className="border border-gray-300 px-4 py-2 rounded-md text-sm hover:bg-gray-100 transition">
							Contact Us
						</button>
					</div>
				</aside>
			</div>
		</div>
	);
}
