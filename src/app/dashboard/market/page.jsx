"use client";

import { useEffect, useState, useMemo } from "react";
import { FaHeart, FaFilter } from "react-icons/fa";
import { formatAddress } from "@/utils/formatAddress";

// Skeleton shimmer effect
const SkeletonCard = () => (
	<div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
		<div className="w-full h-40 bg-gray-200 rounded-lg mb-3"></div>
		<div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
		<div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
		<div className="h-3 bg-gray-200 rounded w-1/3"></div>
	</div>
);

export default function MarketPage() {
    const [activeCategory, setActiveCategory] = useState("All");
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const categories = ["All", "Social Sciences", "Engineering", "Pharmacy"];

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await fetch(`/api/market-materials?page=${page}&pageSize=${pageSize}`, { cache: "no-store" });
                if (!res.ok) throw new Error(`Failed to load materials (${res.status})`);
                const data = await res.json();
                const items = Array.isArray(data) ? data : data.items || [];
                setMaterials(items);
                setTotal(data.total || items.length || 0);
                setTotalPages(data.totalPages || 1);
            } catch (e) {
                setError(e?.message || "Failed to load materials");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [page, pageSize]);

    const startIdx = useMemo(() => (page - 1) * pageSize + 1, [page, pageSize]);
    const endIdx = useMemo(() => Math.min(page * pageSize, total), [page, pageSize, total]);

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
							className={`px-4 py-2 text-sm font-medium rounded-full border transition-all ${
								activeCategory === category
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
                    : // Render materials when data is ready
                      materials.map((item, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all"
                            >
                                {/* Thumbnail */}
                                <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden mb-3 relative">
                                    {item.thumbnailUrl ? (
                                        <img
                                            src={item.thumbnailUrl}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                                            No thumbnail
                                        </div>
                                    )}
                                    <button className="absolute bottom-2 right-2 bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-blue-700">
                                        Get This!
                                    </button>
                                </div>

                                {/* Material Details */}
                                <h3 className="text-sm font-semibold mb-2">{item.title}</h3>

                                <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                                    <p className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                                        {item.userAddress || item.ownerAddress
                                            ? `by ${formatAddress(item.userAddress || item.ownerAddress)}`
                                            : "by Unknown"}
                                    </p>
                                    <p className="flex items-center gap-1">
                                        <FaHeart className="text-red-500" />
                                        {/* Placeholder for likes until implemented */}
                                        0 Likes
                                    </p>
                                </div>

                                <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2">
                                    <span>Price</span>
                                    <span className="text-yellow-600 font-semibold">
                                        {typeof item.price === "number" ? `${item.price} CELO` : item.price || "N/A"}
                                    </span>
                                </div>
                            </div>
                      ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                <div className="text-xs text-gray-500">
                    {total > 0 ? `Showing ${startIdx}-${endIdx} of ${total}` : "No results"}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="px-3 py-1 text-sm border rounded-full disabled:opacity-50"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1 || loading}
                    >
                        Prev
                    </button>
                    {/* Page numbers (compact) */}
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        // show sliding window anchored around current page when many pages
                        const half = 2;
                        let start = Math.max(1, page - half);
                        let end = Math.min(totalPages, start + 4);
                        start = Math.max(1, end - 4);
                        const displayPage = start + i;
                        if (displayPage > totalPages) return null;
                        return (
                            <button
                                key={displayPage}
                                onClick={() => setPage(displayPage)}
                                disabled={loading}
                                className={`px-3 py-1 text-sm border rounded-full ${
                                    page === displayPage ? "bg-blue-600 text-white border-blue-600" : ""
                                }`}
                            >
                                {displayPage}
                            </button>
                        );
                    })}
                    <button
                        className="px-3 py-1 text-sm border rounded-full disabled:opacity-50"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages || loading}
                    >
                        Next
                    </button>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            const next = Number(e.target.value);
                            setPageSize(next);
                            setPage(1);
                        }}
                        className="ml-2 px-2 py-1 text-sm border rounded-md"
                    >
                        {[8, 12, 16, 24].map((n) => (
                            <option key={n} value={n}>{n} / page</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
