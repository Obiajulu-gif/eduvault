"use client";

import Link from "next/link";

export default function HowItWorks() {
	const steps = [
		{
			color: "bg-blue-600",
			title: "Sign up & Connect Wallet",
			description:
				"Create your free student profile and link your crypto wallet — your secure ID on EduVault.",
		},
		{
			color: "bg-yellow-500",
			title: "Upload & Mint Notes",
			description:
				"Add your notes, papers, or reports. Pay a tiny gas fee to mint them as verified NFTs.",
		},
		{
			color: "bg-green-900",
			title: "Earn from Downloads",
			description:
				"Every time another student downloads your work, you earn tokens — automatically.",
		},
	];

	return (
		<section className="bg-[#1e1e1e] text-white py-20 px-6 md:px-16 rounded-[2rem] my-20">
			<div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
				<h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-0">
					How It Works in 3 Simple Steps
				</h2>
				<Link
					href="#"
					className="flex items-center gap-2 text-sm bg-white text-gray-900 font-medium py-2 px-5 rounded-full hover:bg-gray-100 transition-all"
				>
					Create My Student Wallet →
				</Link>
			</div>

			<div className="grid md:grid-cols-3 gap-6">
				{steps.map((step, i) => (
					<div
						key={i}
						className="bg-[#2c2c2c] rounded-2xl p-6 flex flex-col justify-between"
					>
						<div className={`${step.color} w-8 h-8 rounded-md mb-6`}></div>
						<div>
							<h3 className="text-lg font-semibold mb-2">{step.title}</h3>
							<p className="text-gray-300 text-sm leading-relaxed">
								{step.description}
							</p>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
