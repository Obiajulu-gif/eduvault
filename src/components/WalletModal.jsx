"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function WalletModal({ isOpen, onClose }) {
	const [step, setStep] = useState(1);

	const handleNext = () => setStep((prev) => prev + 1);
	const handleBack = () => setStep((prev) => prev - 1);

	const modalVariants = {
		hidden: { opacity: 0, y: 50 },
		visible: {
			opacity: 1,
			y: 0,
			transition: { duration: 0.4, ease: "easeOut" },
		},
		exit: { opacity: 0, y: -30, transition: { duration: 0.3, ease: "easeIn" } },
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
			<motion.div
				variants={modalVariants}
				initial="hidden"
				animate="visible"
				exit="exit"
				className="relative bg-white rounded-2xl shadow-xl w-[90%] max-w-md p-6"
			>
				{/* Close Button */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
				>
					✕
				</button>

				{/* Step 1: Connect Wallet */}
				<AnimatePresence mode="wait">
					{step === 1 && (
						<motion.div
							key="step2"
							variants={modalVariants}
							initial="hidden"
							animate="visible"
							exit="exit"
						>
							<h2 className="text-lg font-semibold text-gray-900 mb-1">
								Get a Wallet
							</h2>
							<p className="text-sm text-gray-500 mb-8">
								Start Exploring Web3 — your wallet is your gateway to the world
								of decentralized apps and crypto.
							</p>

							<div className="flex items-end justify-center gap-6 mb-8">
								<Image
									src="/metamask.svg"
									width={30}
									height={30}
									alt="MetaMask"
									className="drop-shadow"
								/>
								<Image
									src="/phantom.svg"
									width={30}
									height={30}
									alt="Phantom"
									className="drop-shadow"
								/>
								<Image
									src="/coinbase.svg"
									width={30}
									height={30}
									alt="Coinbase"
									className="drop-shadow"
								/>
								<Image
									src="/wallets.svg"
									width={30}
									height={30}
									alt="Other"
									className="drop-shadow"
								/>
							</div>

							<button
								onClick={handleNext}
								className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-full font-semibold transition-all"
							>
								Choose Your First Wallet →
							</button>
						</motion.div>
					)}

					{/* Step 2: Get a Wallet */}
					{step === 2 && (
						<motion.div
							key="step1"
							variants={modalVariants}
							initial="hidden"
							animate="visible"
							exit="exit"
						>
							<h2 className="text-lg font-semibold text-gray-900 mb-1">
								Connect Wallet
							</h2>
							<p className="text-sm text-gray-500 mb-6">
								Get started by connecting your preferred wallet below
							</p>

							<div className="space-y-3">
								{[
									{ name: "MetaMask", icon: "/metamask.svg" },
									{ name: "Phantom", icon: "/phantom.svg" },
									{ name: "Coinbase Wallet", icon: "/coinbase.svg" },
									{ name: "Other Wallets", icon: "/wallets.svg" },
								].map((wallet, i) => (
									<button
										key={i}
										onClick={handleNext}
										className="flex items-center justify-between w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl py-3 px-4 transition-all"
									>
										<div className="flex items-center gap-3">
											<Image
												src={wallet.icon}
												alt={wallet.name}
												width={24}
												height={24}
											/>
											<span className="text-gray-800 text-sm font-medium">
												{wallet.name}
											</span>
										</div>
										<span className="text-gray-400 text-lg">→</span>
									</button>
								))}
							</div>

							<div className="flex items-center gap-2 mt-5">
								<input type="checkbox" className="w-4 h-4 rounded" />
								<button
									onClick={() => setStep(2)}
									className="text-xs text-gray-500 hover:text-gray-700 underline"
								>
									I don’t have a wallet
								</button>
							</div>
						</motion.div>
					)}

					{/* Step 3: Set Up Your Profile */}
					{step === 3 && (
						<motion.div
							key="step3"
							variants={modalVariants}
							initial="hidden"
							animate="visible"
							exit="exit"
						>
							<h2 className="text-lg font-semibold text-gray-900 mb-1">
								Set Up Your Profile
							</h2>
							<p className="text-sm text-gray-500 mb-6">
								We’ll personalize your dashboard and link uploads to your
								student ID.
							</p>

							<form className="space-y-3">
								{[
									"Full Name",
									"Email Address",
									"University / Institution",
									"Country",
									"Short Bio",
								].map((field, i) => (
									<input
										key={i}
										type="text"
										placeholder={field}
										className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-blue-500"
									/>
								))}

								<button
									type="submit"
									className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-full transition-all"
								>
									Create My Student Profile
								</button>
							</form>

							<div className="flex items-start gap-2 mt-4">
								<input type="checkbox" className="mt-1" />
								<p className="text-xs text-gray-500">
									By continuing, you agree to EduVault’s{" "}
									<span className="text-blue-500 underline cursor-pointer">
										Terms
									</span>{" "}
									and{" "}
									<span className="text-blue-500 underline cursor-pointer">
										Privacy Policy
									</span>
									.
								</p>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
		</div>
	);
}
