"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Hero() {
	const fadeUp = {
		hidden: { opacity: 0, y: 40 },
		show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
	};

	const staggerContainer = {
		hidden: {},
		show: { transition: { staggerChildren: 0.2 } },
	};

	// Partner logos from /public
	const partnerLogos = [
		{ name: "Codecraftr", src: "/Codecraftr.png" },
		{ name: "45 Degrees°", src: "/45deg.png" },
		{ name: "Frequenti", src: "/Frequenti.png" },
		{ name: "Convergence", src: "/Convergence.png" },
		{ name: "Cooperative", src: "/Cooperative.png" },
		{ name: "Kinstagt", src: "/Kinstagt.png" },
	];

	return (
		<section className="relative flex flex-col items-center justify-center text-center py-20 md:py-28 px-6 md:px-0 overflow-hidden bg-[#fffaf6]">
			{/* 🔳 Background Grid Pattern */}
			<div
				className="absolute inset-0 bg-[linear-gradient(to_right,#f2ede8_1px,transparent_1px),linear-gradient(to_bottom,#f2ede8_1px,transparent_1px)] bg-[size:40px_40px] opacity-70 pointer-events-none"
				aria-hidden="true"
			></div>

			{/* 💫 Floating Glow Background */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-yellow-100 via-transparent to-blue-100 rounded-full blur-3xl opacity-50"></div>

			{/* 🎬 Animated Content */}
			<motion.div
				variants={staggerContainer}
				initial="hidden"
				animate="show"
				className="relative z-10 flex flex-col items-center"
			>
				{/* Badge */}
				<motion.div
					variants={fadeUp}
					className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1 rounded-full text-xs mb-4 shadow-sm text-black"
				>
					✨ Introducing <span className="font-semibold">EduVault</span>
				</motion.div>

				{/* Headline */}
				<motion.h1
					variants={fadeUp}
					className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-4 max-w-3xl"
				>
					Own your knowledge. <br /> Earn from your notes.
				</motion.h1>

				{/* Subtitle */}
				<motion.p
					variants={fadeUp}
					className="text-gray-600 max-w-2xl text-sm md:text-base mb-8"
				>
					Upload your study materials, past exam papers, and reports — mint them
					as NFTs, share with others, and get rewarded when they’re downloaded.
				</motion.p>

				{/* CTA Buttons */}
				<motion.div variants={fadeUp} className="flex gap-4 mb-12">
					<Link
						href="#"
						className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
					>
						Explore Documents
					</Link>
					<Link
						href="#"
						className="border border-gray-300 hover:bg-gray-100 text-gray-800 font-semibold px-6 py-3 rounded-full transition-all duration-300"
					>
						Start Uploading →
					</Link>
				</motion.div>

				{/* Hero Image with Animated Floating Elements */}
				<motion.div
					variants={fadeUp}
					className="relative mt-8 flex items-center justify-center"
				>
					<motion.div
						className="absolute -left-16 top-10 w-16 h-16 rounded-full  flex items-center justify-center rotate-12"
						animate={{ y: [0, -10, 0] }}
						transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
					>
						<Image
						src="/images/celo.png"
						alt="cele Icon"
						width={80}
						height={80}
					/>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 1, delay: 0.3 }}
					>
						<Image
							src="/hero-person.png" // replace with your image path
							alt="Student"
							width={350}
							height={400}
							className="rounded-2xl  relative z-10"
						/>
					</motion.div>

				<motion.div
					className="absolute right-[-150px] top-0 text-white rounded-full p-4"
					animate={{ y: [0, 10, 0] }}
					transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
				>
					<Image
						src="/message-icon.png"
						alt="Message Icon"
						width={54}
						height={54}
					/>
				</motion.div>
				</motion.div>

				{/* Footer Text */}
				<motion.p variants={fadeUp} className="text-xs text-gray-500 mt-10">
					Supported by Students. Powered by Blockchain.
				</motion.p>

			{/* Partner Logos */}
			<motion.div
				variants={fadeUp}
				className="flex flex-wrap justify-center gap-6 mt-8"
			>
				{partnerLogos.map((logo, i) => (
					<motion.div
						key={i}
						whileHover={{ scale: 1.05 }}
						className="border border-gray-100  rounded-xl py-3 px-5 transition-all flex items-center justify-center"
					>
						<Image
							src={logo.src}
							alt={`${logo.name} logo`}
							width={120}
							height={32}
							className="h-8 w-auto"
						/>
					</motion.div>
				))}
			</motion.div>
			</motion.div>
		</section>
	);
}
