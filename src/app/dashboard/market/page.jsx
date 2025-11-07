"use client";

import { useEffect, useState, useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { abi } from "../../../../contracts/EduVaultAbi";
import { celoSepolia } from "wagmi/chains";
import { FaHeart, FaFilter } from "react-icons/fa";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

// Skeleton shimmer effect
const SkeletonCard = () => (
	<div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
		<div className="w-full h-40 bg-gray-200 rounded-lg mb-3"></div>
		<div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
		<div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
		<div className="h-3 bg-gray-200 rounded w-1/3"></div>
	</div>
);

const contractAddress = "0x3f48520ca0d8d51345b416b5a3e083dac8790f55";

export default function MarketPage() {
	const [activeCategory, setActiveCategory] = useState("All");
	const [materials, setMaterials] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showPopup, setShowPopup] = useState(false);
	const [error, setError] = useState(null);

	const { writeContract, data: hash, isPending } = useWriteContract();
	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
		hash,
	});

	const categories = ["All", "Social Sciences", "Engineering", "Pharmacy"];

	// 1️⃣ Get total minted NFts (number of minted NFTs)
	const { data: totalMinted } = useReadContract({
		address: contractAddress,
		abi,
		functionName: "totalMinted",
		chain: celoSepolia,
	});
	console.log("total minted", totalMinted);


	// 2️⃣ Build array of token IDs [0..totalSupply-1]
	const tokenIds = useMemo(() => {
		if (!totalMinted) return [];
		const count = Number(totalMinted);

		return Array.from({ length: count }, (_, i) => i);
	}, [totalMinted]);

	// 3️⃣ Fetch all tokenURIs
	const { data: tokenUris } = useReadContracts({
		contracts: tokenIds.map((id) => ({
			address: contractAddress,
			abi,
			functionName: "tokenURI",
			args: [id],
			chain: celoSepolia,
		})),
		enabled: tokenIds.length > 0,
	});

	// 4️⃣ Fetch metadata JSON for each NFT
	useEffect(() => {
		if (!tokenUris || tokenUris.length === 0) return;

		const fetchMetadata = async () => {
			setLoading(true);
			try {
				const fetched = await Promise.all(
					tokenUris.map(async (entry, idx) => {
						if (!entry || entry.status !== "success") return null;
						const uri = Array.isArray(entry.result) ? entry.result[0] : entry.result;
						if (!uri || !uri.startsWith("https://")) return null;

						try {
							const res = await fetch(uri, { cache: "no-store" });
							if (!res.ok) throw new Error(`Failed to fetch ${uri}`);
							const json = await res.json();

							return {
								tokenId: idx,
								name: json.name || `Token #${idx}`,
								description: json.description || "",
								image: json.image?.startsWith("https://") ? json.image : null,
								price: json.price || "0",
								visibility: json.visibility || "public",
								timestamp: json.timestamp,
								owner: json.owner,
								metadataUrl: uri,

							};
						} catch (err) {
							console.error("Metadata fetch failed:", err);
							return null;
						}
					})
				);

				// remove duplicates or nulls
				const unique = fetched.filter(Boolean);
				setMaterials(unique);
			} finally {
				setLoading(false);
			}
		};

		fetchMetadata();
	}, [tokenUris]);

	const handleMint = async (uri) => {
		try {
			if (!uri) return alert("Missing token URI!");
			await writeContract({
				address: contractAddress,
				abi,
				functionName: "mint",
				args: [uri],
				chain: celoSepolia,
			});
		} catch (error) {
			console.error("Mint failed:", error);
			alert("Mint failed. See console for details.");
		}
	};
	useEffect(() => {
		if (isSuccess) {
			setShowPopup(true);
		}
	}, [isSuccess]);


	return (
		<div className="min-h-screen bg-gray-50 text-gray-900">
			{/* Header Section */}
			<div className="mb-6">
				<h1 className="text-xl md:text-2xl font-bold mb-4">
					Discover Study Materials from Students Like You
				</h1>

				{/* Category Filter Bar */}
				<div className="flex flex-wrap items-center gap-3 mb-6">
					{categories.map((category) => (
						<button
							key={category}
							onClick={() => setActiveCategory(category)}
							className={`px-4 py-2 text-sm font-medium rounded-full border transition-all ${activeCategory === category
								? "bg-blue-600 text-white border-blue-600"
								: "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
								}`}
						>
							{category}
						</button>
					))}
					<button className="ml-auto flex items-center gap-2 text-gray-700 border border-gray-300 px-4 py-2 rounded-full text-sm hover:bg-gray-100">
						<FaFilter className="text-gray-600" /> Filter
					</button>
				</div>
			</div>

			{/* Error State */}
			{error && (
				<div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded">
					{error}
				</div>
			)}

			{/* Grid Section */}
			<div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
				{loading
					? // Render Skeletons while loading
					Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
					: materials.length === 0
						? <p className="col-span-full text-center text-gray-500">No NFTs found.</p>
						: materials.map((item, index) => (
							<div
								key={index}
								className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all"
							>
								{/* Image */}
								<div className="w-full h-40 bg-gray-200 rounded-lg flex items-center justify-center mb-3 relative overflow-hidden">
									{item.image ? (
										<img
											src={item.image}
											alt={item.name}
											className="w-full h-full object-cover"
										/>
									) : (
										<span className="text-gray-500 text-xs">No Image</span>
									)}
									<button
										onClick={() => handleMint(item.metadataUrl)}
										disabled={isPending || isConfirming}
										className={`absolute bottom-2 right-2 text-xs font-medium px-4 py-2 rounded-full transition ${isPending || isConfirming
											? "bg-gray-400 cursor-not-allowed"
											: "bg-blue-600 hover:bg-blue-700 text-white"
											}`}
									>
										{isPending
											? "Confirm..."
											: isConfirming
												? "Minting..."
												: isSuccess
													? "Minted!"
													: "Mint"}
									</button>

								</div>

								{/* Material Details */}
								<h3 className="text-sm font-semibold mb-2">{item.name}</h3>
								<p className="text-xs text-gray-600 line-clamp-2 mb-2">
									{item.description}
								</p>

								<div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2">
									<span className="capitalize">{item.visibility}</span>
									<span className="text-green-600 font-semibold">
										₦{Number(item.price).toLocaleString()}
									</span>
								</div>

								<div className="text-[11px] text-gray-400 mt-1">
									Minted on{" "}
									{item.timestamp
										? new Date(item.timestamp).toLocaleDateString("en-US", {
											month: "short",
											day: "2-digit",
											year: "numeric",
										})
										: "—"}
								</div>
							</div>
						))}
			</div>
			{showPopup && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-2xl shadow-lg p-6 w-80 relative animate-fade-in">
						{/* Close Button */}
						<button
							onClick={() => setShowPopup(false)}
							className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
						>
							✕
						</button>

						{/* Success Icon */}
						<div className="flex justify-center mb-4">
							<div className="bg-green-100 text-green-600 p-3 rounded-full">
								✅
							</div>
						</div>

						{/* Message */}
						<h3 className="text-lg font-semibold text-center mb-2">
							NFT Minted Successfully!
						</h3>
						<p className="text-sm text-gray-600 text-center mb-4">
							Document downloaded successfully to your wallet
						</p>

						{/* Close Action */}
						<button
							onClick={() => setShowPopup(false)}
							className="w-full bg-blue-600 text-white rounded-full py-2 hover:bg-blue-700 transition"
						>
							Close
						</button>
					</div>
				</div>
			)}

		</div>
	);
}
