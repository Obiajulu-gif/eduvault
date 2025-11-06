"use client";

import Image from "next/image";
import { FaCrown } from "react-icons/fa";

export default function TopSharedMaterials() {
	const sharedMaterials = [
		{
			title: "CHM 112 – Lab Report (Year 1)",
			price: "0.25 CELO",
			authorImg: "/author1.png",
		},
		{
			title: "GNS 201 – Use of English (Year 2)",
			price: "0.25 CELO",
			authorImg: "/author2.png",
		},
		{
			title: "CSC 301 – Data Structures (Year 3)",
			price: "0.26 CELO",
			authorImg: "/author3.png",
		},
	];

	const topAuthors = [
		{
			rank: 1,
			name: "CryptoFunks",
			price: "0.25 CELO",
			change: "+26.52%",
			color: "text-green-500",
		},
		{
			rank: 2,
			name: "Cryptix",
			price: "0.25 CELO",
			change: "+10.52%",
			color: "text-red-500",
		},
		{
			rank: 3,
			name: "Frenesware",
			price: "0.25 CELO",
			change: "+5.52%",
			color: "text-green-500",
		},
		{
			rank: 4,
			name: "PunkArt",
			price: "50,008 CELO",
			change: "+1.52%",
			color: "text-green-500",
		},
		{
			rank: 5,
			name: "Art Crypto",
			price: "4,524 CELO",
			change: "+2.52%",
			color: "text-red-500",
		},
	];

	return (
		<section className="py-20 bg-white px-6 md:px-20">
			{/* Section Header */}
			<div className="flex items-center justify-between mb-8">
				<h2 className="text-xl md:text-2xl font-bold text-gray-900">
					Top Shared Study Materials
				</h2>
				<button className="flex items-center text-sm text-gray-700 hover:text-black transition-all">
					View All Documents →
				</button>
			</div>

			{/* Content Grid */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
				{/* Left Section - Featured Material */}
				<div className="bg-gray-100 rounded-2xl h-[300px] flex flex-col justify-between p-4 relative">
					<div className="absolute inset-0 bg-gray-200 rounded-2xl flex items-center justify-center">
						<span className="text-gray-400 text-sm">📄 Document Preview</span>
					</div>

					<div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
						<div>
							<h3 className="text-sm font-semibold text-gray-800">
								ECN 101 – Principles of Microeconomics (Year 1)
							</h3>
							<p className="text-xs text-gray-500">
								by{" "}
								<span className="font-medium text-gray-700">Chijioke M.</span>
							</p>
						</div>
						<div className="flex items-center gap-1">
							<Image
								src="/celo.png"
								alt="CELO"
								width={18}
								height={18}
								className="rounded-full"
							/>
							<span className="text-xs font-semibold text-gray-700">
								0.25 CELO
							</span>
						</div>
					</div>
				</div>

				{/* Middle Section - List of Shared Materials */}
				<div className="flex flex-col space-y-4">
					{sharedMaterials.map((material, i) => (
						<div
							key={i}
							className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl p-3 hover:shadow-md transition-all duration-200"
						>
							<div className="flex items-center gap-3">
								<div className="w-14 h-14 bg-gray-200 rounded-lg"></div>
								<div>
									<h3 className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">
										{material.title}
									</h3>
									<div className="flex items-center gap-2 mt-1">
										<Image
											src="/celo.png"
											alt="CELO"
											width={14}
											height={14}
										/>
										<span className="text-xs font-medium text-gray-600">
											{material.price}
										</span>
									</div>
								</div>
							</div>
							<button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-4 rounded-full">
								Get This!
							</button>
						</div>
					))}
				</div>

				{/* Right Section - Top Authors */}
				<div>
					<h3 className="text-lg font-semibold text-gray-800 mb-2">
						Top Authors For The Month
					</h3>
					<p className="text-xs text-gray-500 mb-4">
						Last <span className="text-orange-500 font-medium">7 days</span>
					</p>
					<div className="space-y-3">
						{topAuthors.map((author) => (
							<div
								key={author.rank}
								className="flex justify-between items-center bg-white border border-gray-100 shadow-sm rounded-xl p-3 hover:shadow-md transition-all"
							>
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-semibold text-sm text-gray-700">
										{author.rank}
									</div>
									<div>
										<h4 className="text-sm font-semibold text-gray-800">
											{author.name}
										</h4>
										<p className="text-xs text-gray-500">{author.price}</p>
									</div>
								</div>
								<span className={`text-xs font-semibold ${author.color}`}>
									{author.change}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
