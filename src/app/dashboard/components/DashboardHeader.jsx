"use client";
import { FaSearch } from "react-icons/fa";
import Image from "next/image";

export default function DashboardHeader() {
	return (
		<header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
			{/* Search Bar */}
			<div className="flex-1 max-w-xl relative">
				<FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
				<input
					type="text"
					placeholder="Search Item, Collection and Account..."
					className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
				/>
			</div>

			{/* Right Side */}
			<div className="flex items-center gap-4">
				<button className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition flex items-center gap-2">
					Upload Material →
				</button>
				<div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
					<Image
						src="/images/profile.png"
						alt="Profile"
						width={40}
						height={40}
						className="object-cover w-full h-full"
					/>
				</div>
			</div>
		</header>
	);
}
