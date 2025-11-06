"use client";

import Sidebar from "./components/Sidebar";
import DashboardHeader from "./components/DashboardHeader";
import WelcomeBanner from "./components/WelcomeBanner";
import EarningsSection from "./components/EarningsSection";
import TrendingMaterials from "./components/TrendingMaterials";
import LatestActivity from "./components/LatestActivity";
import TopCreators from "./components/TopCreators";

export default function DashboardPage() {
	return (
		<div className="flex min-h-screen bg-gray-50 text-gray-900">
			{/* Sidebar */}
			<Sidebar />

			{/* Main Dashboard Area */}
			<div className="flex-1 flex flex-col overflow-y-auto">
				<DashboardHeader />

				<div className="p-8 space-y-8">
					{/* Welcome Banner + Stats Row */}
					<div className="grid md:grid-cols-3 gap-6 items-start">
						<div className="md:col-span-2">
							<WelcomeBanner />
						</div>
						<EarningsSection />
					</div>

					{/* Trending + Top Creators + Latest Activity */}
					<div className="grid md:grid-cols-3 gap-8">
						<div className="md:col-span-2 space-y-8">
							<TrendingMaterials />
							<LatestActivity />
						</div>
						<TopCreators />
					</div>
				</div>
			</div>
		</div>
	);
}
