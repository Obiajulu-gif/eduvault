"use client";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

export default function EarningsSection() {
	const stats = [
		{
			label: "Earnings",
			value: "2.00 CELO",
			change: "+12.3%",
			iconColor: "text-green-600",
			changeColor: "text-green-600",
		},
		{
			label: "Uploaded Notes",
			value: "7 NOTES",
			change: "+8.1%",
			iconColor: "text-green-600",
			changeColor: "text-green-600",
		},
		{
			label: "Downloads",
			value: "182",
			change: "-5.3%",
			iconColor: "text-red-600",
			changeColor: "text-red-600",
		},
		{
			label: "Rank",
			value: "#12 UNN",
			change: "+3.2%",
			iconColor: "text-green-600",
			changeColor: "text-green-600",
		},
	];

	return (
		<div className="grid sm:grid-cols-2 gap-4">
			{stats.map((item, index) => (
				<div
					key={index}
					className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
				>
					<div className="flex justify-between items-center mb-2">
						<h3 className="text-sm text-gray-500">{item.label}</h3>
						{item.change.startsWith("+") ? (
							<FaArrowUp className={`w-4 h-4 ${item.iconColor}`} />
						) : (
							<FaArrowDown className={`w-4 h-4 ${item.iconColor}`} />
						)}
					</div>
					<div className="text-lg font-bold">{item.value}</div>
					<p className={`text-sm ${item.changeColor}`}>{item.change}</p>
				</div>
			))}
		</div>
	);
}

