import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/mongodb";

export default async function MyMaterialsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) redirect("/");

  let user;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    redirect("/");
  }

  const db = await getDb();
  const userAddress = user.walletAddress || user.address || user.id;
  const items = await db
    .collection("materials")
    .find({ userAddress })
    .sort({ createdAt: -1 })
    .toArray();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto py-10 px-6">
        <h1 className="text-2xl font-bold mb-6">My Materials</h1>
        {items.length === 0 ? (
          <p className="text-sm text-gray-600">No materials uploaded yet.</p>
        ) : (
          <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <li key={item._id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                {item.thumbnailUrl && (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-36 object-cover rounded-md mb-3"
                  />
                )}
                <h3 className="text-base font-semibold">{item.title}</h3>
                {item.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center justify-between mt-3 text-sm">
                  <span className="text-gray-500">{item.visibility}</span>
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}