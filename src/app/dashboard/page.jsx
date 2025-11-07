import WelcomeBanner from "./components/WelcomeBanner";
import EarningsSection from "./components/EarningsSection";
import TrendingMaterials from "./components/TrendingMaterials";
import LatestActivity from "./components/LatestActivity";
import TopCreators from "./components/TopCreators";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { unstable_cache } from "next/cache";

const getCachedUser = unstable_cache(
    async (id) => {
        const db = await getDb();
        const users = db.collection("users");
        return users.findOne({ _id: new ObjectId(id) });
    },
    ["user-by-id"],
    { revalidate: 60 }
);

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
        redirect("/");
    }

    let payload;
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("JWT_SECRET not configured");
        }
        payload = jwt.verify(token, secret);
    } catch (e) {
        redirect("/");
    }

    const user = await getCachedUser(payload.sub);
    if (!user) {
        redirect("/");
    }

    return (
        <div className="space-y-8">
            {/* Welcome Banner + Stats */}
            <div className="grid md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2">
                    <WelcomeBanner user={user} />
                </div>
                <EarningsSection />
            </div>

            {/* Trending + Latest Activity + Top Creators */}
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <TrendingMaterials />
                    <LatestActivity />
                </div>
                <TopCreators />
            </div>
        </div>
    );
}
