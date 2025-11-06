"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import WalletModal from "@/components/WalletModal"; // 👈 make sure this path is correct

export default function Navbar() {
	const [menuOpen, setMenuOpen] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);

	return (
		<header className="bg-[#fffaf6] flex justify-center py-6 px-4 md:px-0">
			<motion.nav
				initial={{ y: -40, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.6, ease: "easeOut" }}
				className="flex items-center justify-between w-full md:w-[90%] lg:w-[85%] max-w-6xl 
        bg-white border border-gray-200 rounded-full py-3 px-6 md:px-10 relative z-20"
			>
				{/* Logo */}
				<div className="text-lg font-bold tracking-tight text-gray-900">
					EduVault.
				</div>

				{/* Desktop Menu */}
				<div className="hidden md:flex items-center space-x-10 text-sm font-medium text-gray-700">
					<Link
						href="#"
						className="hover:text-gray-900 transition-all duration-200"
					>
						How It Works
					</Link>
					<Link
						href="#"
						className="hover:text-gray-900 transition-all duration-200"
					>
						Marketplace
					</Link>
					<Link
						href="#"
						className="hover:text-gray-900 transition-all duration-200"
					>
						Support
					</Link>
					<Link
						href="#"
						className="hover:text-gray-900 transition-all duration-200"
					>
						Docs
					</Link>
				</div>

			{/* Connect Wallet Button */}
			<button
				onClick={() => setIsModalOpen(true)}
				className="hidden md:flex items-center gap-2 bg-white hover:bg-gray-100 text-black border border-gray-300 
          text-sm font-semibold py-2 px-5 rounded-full transition-all duration-300"
			>
				Connect Wallet →
			</button>

				{/* Mobile Menu Button */}
				<button
					className="md:hidden flex flex-col space-y-1"
					onClick={() => setMenuOpen(!menuOpen)}
				>
					<span className="w-5 h-0.5 bg-black"></span>
					<span className="w-5 h-0.5 bg-black"></span>
					<span className="w-5 h-0.5 bg-black"></span>
				</button>

				{/* Mobile Dropdown Menu */}
				{menuOpen && (
					<div className="absolute top-20 left-0 w-full bg-white border-t border-gray-200 shadow-sm flex flex-col items-center space-y-4 py-6 text-gray-700 md:hidden z-50">
						<Link href="#">How It Works</Link>
						<Link href="#">Marketplace</Link>
						<Link href="#">Support</Link>
						<Link href="#">Docs</Link>
						<button
							onClick={() => {
								setMenuOpen(false);
								setIsModalOpen(true);
							}}
							className="bg-gray-100 hover:bg-gray-200 text-sm font-semibold py-2 px-5 rounded-full"
						>
							Connect Wallet →
						</button>
					</div>
				)}
			</motion.nav>

			{/* Wallet Modal */}
			<WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
		</header>
	);
}
