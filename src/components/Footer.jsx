"use client";

import { FaXTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa6";
import Link from "next/link";

export default function Footer() {
	return (
		<footer className="bg-[#1e1e1e] text-gray-300 py-10 px-6 md:px-16">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-10">
				{/* Left Section - Brand Name */}
				<h1 className="text-2xl font-bold text-white">EduVault</h1>

				{/* Newsletter Section */}
				<div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
					<div className="flex items-center bg-[#2c2c2c] border border-gray-700 rounded-full overflow-hidden w-full md:w-[320px]">
						<input
							type="email"
							placeholder="Subscribe to our newsletter..."
							className="bg-transparent px-4 py-2 text-sm text-gray-300 w-full focus:outline-none"
						/>
						<button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 transition-all">
							Subscribe
						</button>
					</div>
					<p className="text-xs text-gray-500">
						By subscribing you agree to our{" "}
						<Link
							href="#"
							className="text-gray-300 hover:text-white underline underline-offset-2"
						>
							Privacy Policy
						</Link>
					</p>
				</div>
			</div>

			<hr className="border-gray-700 my-8" />

			{/* Bottom Section */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-sm">
				{/* Footer Links */}
				<div className="flex flex-wrap gap-6 text-gray-400">
					<Link href="#" className="hover:text-white transition">
						How It Works
					</Link>
					<Link href="#" className="hover:text-white transition">
						Marketplace
					</Link>
					<Link href="#" className="hover:text-white transition">
						Support
					</Link>
					<Link href="#" className="hover:text-white transition">
						Docs
					</Link>
				</div>

				{/* Social Icons */}
				<div className="flex flex-col md:flex-row items-start md:items-center gap-4">
					<div className="flex items-center gap-3 text-gray-400">
						<span>Contact with us:</span>
                        <a
                            href="https://x.com/eduvault1"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white transition"
                            aria-label="EduVault on X"
                        >
                            <FaXTwitter size={16} />
                        </a>
						<Link href="#" className="hover:text-white transition">
							<FaLinkedinIn size={16} />
						</Link>
						<Link href="#" className="hover:text-white transition">
							<FaInstagram size={16} />
						</Link>
					</div>
					<p className="text-xs text-gray-500 md:ml-6">
						© {new Date().getFullYear()} EduVault. All Rights Reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}
