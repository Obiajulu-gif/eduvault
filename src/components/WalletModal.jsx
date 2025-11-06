"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function WalletModal({ isOpen, onClose }) {
    const [step, setStep] = useState(1);
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        institution: "",
        country: "",
        bio: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);

    const validate = () => {
        const e = {};
        if (!formData.fullName || formData.fullName.trim().length < 2) {
            e.fullName = "Please enter your full name.";
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email || !emailRegex.test(formData.email)) {
            e.email = "Please enter a valid email address.";
        }
        if (formData.bio && formData.bio.length > 300) {
            e.bio = "Bio should be 300 characters or fewer.";
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

	const handleNext = () => setStep((prev) => prev + 1);
	const handleBack = () => setStep((prev) => prev - 1);

	// 🚀 Redirect to dashboard when profile setup is complete
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        try {
            const res = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Profile creation failed");
            setSuccess(true);
            setTimeout(() => {
                onClose();
                router.push("/dashboard");
            }, 900);
        } catch (err) {
            console.error(err);
            const message = err?.message || "Could not create profile. Please try again.";
            setErrors({ submit: message });
        } finally {
            setSubmitting(false);
        }
    };

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

				{/* Steps */}
				<AnimatePresence mode="wait">
					{/* Step 1: Get a Wallet */}
					{step === 1 && (
						<motion.div
							key="step1"
							variants={modalVariants}
							initial="hidden"
							animate="visible"
							exit="exit"
						>
							<h2 className="text-lg font-semibold text-gray-900 mb-1">
								Get a Wallet
							</h2>
							<p className="text-sm text-gray-500 mb-8">
								Start exploring Web3 — your wallet is your gateway to the world
								of decentralized apps and crypto.
							</p>

							<div className="flex items-end justify-center gap-6 mb-8">
								<Image
									src="/metaflow.png"
									width={53}
									height={53}
									alt="MetaMask"
								/>
								<Image
									src="/phantflow.png"
									width={53}
									height={53}
									alt="Phantom"
								/>
								<Image
									src="/coinflow.png"
									width={53}
									height={53}
									alt="Coinbase"
								/>
								<Image
									src="/walletsflow.png"
									width={53}
									height={53}
									alt="Other"
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

					{/* Step 2: Connect Wallet */}
					{step === 2 && (
						<motion.div
							key="step2"
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
									{ name: "MetaMask", icon: "/metamask.png" },
									{ name: "Phantom", icon: "/phantom.png" },
									{ name: "Coinbase Wallet", icon: "/coinbase.png" },
									{ name: "Other Wallets", icon: "/wallets.png" },
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
												width={128}
												height={128}
											/>
											{/* <span className="text-gray-800 text-sm font-medium">
												{wallet.name}
											</span> */}
										</div>
										<span className="text-gray-400 text-lg">→</span>
									</button>
								))}
							</div>

							<div className="flex items-center gap-2 mt-5">
								<input type="checkbox" className="w-4 h-4 rounded" />
								<button
									onClick={() => setStep(1)}
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

                            <form className="space-y-3" onSubmit={handleProfileSubmit}>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    required
                                    className="w-full text-[#98A2B3] border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-blue-500"
                                />
                                {errors.fullName && (
                                    <p className="text-red-500 text-xs">{errors.fullName}</p>
                                )}
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    className="w-full text-[#98A2B3] border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-blue-500"
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-xs">{errors.email}</p>
                                )}
                                <input
                                    type="text"
                                    placeholder="University / Institution"
                                    value={formData.institution}
                                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                                    className="w-full text-[#98A2B3] border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-blue-500"
                                />
                                <input
                                    type="text"
                                    placeholder="Country"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    className="w-full text-[#98A2B3] border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                    placeholder="Short Bio"
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    className="w-full text-[#98A2B3] border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-blue-500"
                                    rows={3}
                                />
                                {errors.bio && (
                                    <p className="text-red-500 text-xs">{errors.bio}</p>
                                )}

                                {errors.submit && (
                                    <p className="text-red-500 text-xs">{errors.submit}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-full transition-all disabled:opacity-60"
                                >
                                    {submitting ? "Creating..." : "Create My Student Profile"}
                                </button>
                            </form>

                            {success && (
                                <div className="mt-3 text-green-600 text-sm font-medium">Profile created! Redirecting…</div>
                            )}

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
