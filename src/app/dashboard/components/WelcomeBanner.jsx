"use client";
import Image from "next/image";
import { FaArrowRight } from "react-icons/fa";

export default function WelcomeBanner() {
	return (
		<div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl p-8 flex justify-between items-center">
			<div>
				<h1 className="text-3xl font-bold mb-2">👋 Welcome back, Emmanuel!</h1>
				<p className="text-gray-600 mb-4">Discover and sell your own NFTs.</p>
				<button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
					Discover Now <FaArrowRight />
				</button>
			</div>
			<div className="w-40 h-40 rounded-full overflow-hidden flex items-center justify-center">
				<Image
					src="/images/celo.png"
					alt="Celo Icon"
					width={144}
					height={144}
					className="rounded-full object-cover"
				/>
			</div>
		</div>
	);
}
