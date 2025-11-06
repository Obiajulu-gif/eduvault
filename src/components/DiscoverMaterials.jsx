"use client";

import Image from "next/image";
import { FaHeart } from "react-icons/fa";
import { FiFilter } from "react-icons/fi";

export default function DiscoverMaterials() {
	const materials = Array(9).fill({
		title: "CHM 112 – Lab Report Template (UNN)",
		author: "Chijioke M.",
		likes: "21.5K",
		bid: "0.25 CELO",
		time: "01:09:40",
	});

	const categories = ["All", "Social Sciences", "Engineering", "Pharmacy"];

	return (
		<section className="py-20 px-6 md:px-16 bg-white">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
				<h2 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
					Discover More Study Materials
				</h2>
				<button className="flex items-center gap-2 border border-gray-300 text-gray-700 text-sm py-2 px-4 rounded-full hover:bg-gray-100 transition-all">
					<FiFilter /> Filter
				</button>
			</div>

			{/* Category Buttons */}
			<div className="flex flex-wrap gap-3 mb-10">
				{categories.map((cat, i) => (
					<button
						key={i}
						className={`text-sm font-medium px-5 py-2 rounded-full border ${
							i === 0
								? "bg-blue-600 text-white border-blue-600"
								: "border-gray-300 text-gray-700 hover:bg-gray-100"
						} transition-all`}
					>
						{cat}
					</button>
				))}
			</div>

			{/* Grid */}
			<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
				{materials.map((item, i) => (
					<div
						key={i}
						className="bg-gray-50 border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all duration-300"
					>
						<div className="bg-gray-200 rounded-xl h-48 mb-4 flex items-center justify-center text-gray-400 text-sm">
							📘 Material Preview
						</div>

						<button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-5 rounded-full mb-4">
							Get This!
						</button>

						<h3 className="text-sm font-semibold text-gray-800 mb-1 truncate">
							{item.title}
						</h3>
						<p className="text-xs text-gray-500 mb-3">by {item.author}</p>

						<div className="flex justify-between items-center text-xs text-gray-500">
							<div className="flex items-center gap-1">
								<FaHeart className="text-pink-500" />
								<span>{item.likes} Likes</span>
							</div>
							<span>Current Bid</span>
						</div>

						<div className="flex justify-between items-center mt-1">
							<span className="text-xs text-gray-500 flex items-center gap-1">
								⏱ {item.time}
							</span>
							<span className="text-sm font-semibold text-gray-800">
								{item.bid}
							</span>
						</div>
					</div>
				))}
			</div>

			{/* Load More Button */}
			<div className="flex justify-center mt-12">
				<button className="flex items-center gap-2 border border-gray-300 text-gray-700 text-sm py-2 px-6 rounded-full hover:bg-gray-100 transition-all">
					Load More
				</button>
			</div>
		</section>
	);
}
