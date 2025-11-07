"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FaHeart, FaCheckCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import BuyNowModal from "./modals/BuyNowModal";

export default function MaterialDetailsPage() {
	const [showBuyModal, setShowBuyModal] = useState(false);

	const material = {
		title: "ECO 201 – Principles of Microeconomics (Complete Lecture Notes)",
		description:
			"A detailed 60-page lecture note covering demand, supply, market equilibrium, elasticity, and production theory — essential for first and second-year students preparing for exams.",
		price: "0.25 CELO",
		likes: "18.6K",
		reviews: "76 Reviews",
		image: "/images/image2.jpg",
		author: {
			name: "Christian Okafor",
			institution: "University of Nigeria, Nsukka (UNN)",
			department: "Economics",
			level: "200 Level",
			date: "October 25, 2025",
			verified: true,
		},
		tags: ["MicroEconomics", "ECO201", "UNN"],
	};

	const relatedMaterials = [
		"/images/image1.jpg",
		"/images/image3.jpg",
		"/images/image4.jpg",
		"/images/image5.jpg",
	];

	return (
		<>
			<Navbar />

			<section className="relative bg-[#fffaf6] min-h-screen py-10 px-6 md:px-20">
				{/* 🔹 Background Grid Pattern */}
				<div
					className="absolute inset-0 bg-[linear-gradient(to_right,#f2ede8_1px,transparent_1px),linear-gradient(to_bottom,#f2ede8_1px,transparent_1px)] bg-[size:40px_40px] opacity-70 pointer-events-none -z-10"
					aria-hidden="true"
				></div>

				{/* Main Container */}
				<motion.div
					initial={{ opacity: 0, y: 40 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="max-w-6xl mx-auto"
				>
					{/* Breadcrumb */}
					<p className="text-sm text-gray-500 mb-6">
						<Link href="/marketplace" className="text-blue-600 hover:underline">
							Marketplace
						</Link>{" "}
						→ ECO 201
					</p>

					{/* Top Section */}
					<div className="flex flex-col md:flex-row gap-10">
						{/* Image Preview */}
						<div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
							<Image
								src={material.image}
								alt={material.title}
								width={800}
								height={600}
								className="w-full h-[380px] object-cover"
							/>
						</div>

						{/* Info Section */}
						<div className="flex-1 space-y-5">
							<h1 className="text-2xl md:text-3xl font-bold text-gray-900">
								{material.title}
							</h1>
							<p className="text-gray-600 text-sm leading-relaxed">
								{material.description}
							</p>

							{/* Price & Rating */}
							<div className="flex items-center gap-4 mt-4">
								<div className="flex items-center gap-2">
									<Image
										src="/images/celo.png"
										alt="Celo"
										width={28}
										height={28}
										className="rounded-full"
									/>
									<span className="text-lg font-semibold text-gray-900">
										{material.price}
									</span>
								</div>
								<span className="text-sm text-yellow-500">⭐ 4.8</span>
								<span className="text-gray-400 text-sm">
									({material.reviews})
								</span>
							</div>

							{/* Buttons */}
							<div className="flex items-center gap-3 mt-4">
								<button className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-100 transition">
									Add to Cart
								</button>
								<button
									onClick={() => setShowBuyModal(true)}
									className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition"
								>
									Buy Now!
								</button>
							</div>

							{/* Likes */}
							<div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
								<FaHeart className="text-pink-500" />
								{material.likes} Likes
							</div>
						</div>
					</div>

					{/* About + Author Info */}
					<div className="grid md:grid-cols-2 gap-6 mt-10">
						{/* About */}
						<div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
							<h2 className="text-lg font-semibold text-gray-900 mb-3">
								About
							</h2>
							<p className="text-sm text-gray-600 mb-4 leading-relaxed">
								{material.description}
							</p>
							<div className="flex flex-wrap gap-2 mt-2">
								{material.tags.map((tag, i) => (
									<span
										key={i}
										className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
									>
										#{tag}
									</span>
								))}
							</div>
						</div>

						{/* Author Info */}
						<div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
							<h2 className="text-lg font-semibold text-gray-900 mb-3">
								Author Info
							</h2>
							<div className="text-sm text-gray-600 space-y-2">
								<p>
									<strong className="text-gray-800">Author:</strong>{" "}
									{material.author.name}
								</p>
								<p>
									<strong className="text-gray-800">Institution:</strong>{" "}
									{material.author.institution}
								</p>
								<p>
									<strong className="text-gray-800">Department:</strong>{" "}
									{material.author.department}
								</p>
								<p>
									<strong className="text-gray-800">Level:</strong>{" "}
									{material.author.level}
								</p>
								<p>
									<strong className="text-gray-800">Uploaded:</strong>{" "}
									{material.author.date}
								</p>
								<p className="flex items-center gap-2">
									<strong className="text-gray-800">Verification:</strong>
									{material.author.verified ? (
										<span className="text-green-600 flex items-center gap-1 text-xs font-medium">
											<FaCheckCircle /> Minted on Celo
										</span>
									) : (
										<span className="text-red-500 text-xs font-medium">
											Not Verified
										</span>
									)}
								</p>
							</div>
						</div>
					</div>

					{/* Related Notes */}
					<div className="mt-14">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">
							Discover more Notes
						</h2>

						<div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
							{relatedMaterials.map((src, i) => (
								<div
									key={i}
									className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition overflow-hidden"
								>
									<div className="relative w-full h-40">
										<Image
											src={src}
											alt="Related note"
											fill
											className="object-cover"
										/>
									</div>
									<div className="p-4">
										<h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
											CHM 112 – Lab Report Template (UNN)
										</h3>
										<p className="text-xs text-gray-500 mb-2">by Chijioke M.</p>
										<div className="flex justify-between items-center text-xs text-gray-500">
											<span>0.25 CELO</span>
											<span>21.5K Likes</span>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</motion.div>
			</section>

			{/* 💳 Integrated Buy Now Modal */}
			<BuyNowModal
				isOpen={showBuyModal}
				onClose={() => setShowBuyModal(false)}
				price={material.price}
			/>
		</>
	);
}
