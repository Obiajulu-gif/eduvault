"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function HowItWorks() {
	const steps = [
		{
			color: "from-blue-500 to-indigo-500",
			title: "Sign up & Connect Wallet",
			description:
				"Create your free student profile and link your crypto wallet — your secure ID on EduVault.",
			delay: 0.2,
		},
		{
			color: "from-yellow-400 to-orange-500",
			title: "Upload & Mint Notes",
			description:
				"Add your notes, papers, or reports. Pay a tiny gas fee to mint them as verified NFTs.",
			delay: 0.4,
		},
		{
			color: "from-green-500 to-emerald-600",
			title: "Earn from Downloads",
			description:
				"Every time another student downloads your work, you earn tokens — automatically.",
			delay: 0.6,
		},
	];

	const fadeUp = {
		hidden: { opacity: 0, y: 40 },
		show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
	};

	return (
		<section className="relative bg-[#0f0f0f] text-white py-20 px-6 md:px-16 rounded-[2rem] my-24 overflow-hidden">
			{/* 🔹 Subtle Animated Gradient Glow */}
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.06),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.04),transparent_60%)]"></div>

			{/* 🔹 Section Header */}
			<motion.div
				initial="hidden"
				whileInView="show"
				viewport={{ once: true }}
				variants={fadeUp}
				className="relative flex flex-col md:flex-row md:items-center justify-between mb-14 z-10"
			>
				<h2 className="text-3xl md:text-4xl font-bold mb-6 md:mb-0 leading-snug">
					How It Works in 3 Simple Steps
				</h2>
				<Link
					href="#"
					className="flex items-center gap-2 text-sm bg-white text-gray-900 font-semibold py-3 px-6 rounded-full hover:bg-gray-100 transition-all duration-300 shadow-sm"
				>
					Create My Student Wallet →
				</Link>
			</motion.div>

			{/* 🔹 Steps Grid */}
			<div className="grid md:grid-cols-3 gap-8 relative z-10">
				{steps.map((step, i) => (
					<motion.div
						key={i}
						initial={{ opacity: 0, y: 50 }}
						whileInView={{
							opacity: 1,
							y: 0,
							transition: { delay: step.delay, duration: 0.6, ease: "easeOut" },
						}}
						whileHover={{
							scale: 1.03,
							boxShadow: "0 10px 30px rgba(255,255,255,0.08)",
						}}
						className="bg-[#1b1b1b] rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 border border-white/10 hover:border-white/20 backdrop-blur-sm"
					>
						{/* Icon Circle */}
						<div
							className={`w-12 h-12 mb-6 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg shadow-black/30`}
						>
							<span className="text-xl font-bold text-white">{i + 1}</span>
						</div>

						{/* Text Content */}
						<div>
							<h3 className="text-lg font-semibold mb-3 tracking-tight text-white">
								{step.title}
							</h3>
							<p className="text-gray-400 text-sm leading-relaxed">
								{step.description}
							</p>
						</div>
					</motion.div>
				))}
			</div>

			{/* 🔹 Decorative Animated Glow Line */}
			<motion.div
				initial={{ opacity: 0, width: 0 }}
				whileInView={{ opacity: 1, width: "100%" }}
				transition={{ duration: 1.2, delay: 0.4, ease: "easeInOut" }}
				className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-blue-500 via-yellow-400 to-green-500 opacity-40"
			/>
		</section>
	);
}
