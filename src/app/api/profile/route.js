import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";
import { getDb } from "@/lib/mongodb";
import jwt from "jsonwebtoken";

export async function POST(request) {
  try {
    const body = await request.json();
    const { fullName, email, institution, country, bio } = body || {};

    if (!fullName || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection("users");

    // Check duplicate email
    const existing = await users.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const newUser = {
      fullName,
      email,
      institution: institution || null,
      country: country || null,
      bio: bio || null,
      createdAt: new Date().toISOString(),
    };

    const result = await users.insertOne(newUser);
    newUser._id = result.insertedId;

    // Attempt to send welcome email (non-blocking failure)
    let emailSent = false;
    try {
      await sendWelcomeEmail(email, fullName);
      emailSent = true;
    } catch (e) {
      // Log server-side; don’t fail profile creation on email issues
      console.error("Welcome email failed:", e?.message || e);
    }

    // Create auth token and set httpOnly cookie
    const secret = process.env.JWT_SECRET;
    let response = NextResponse.json({ success: true, user: newUser, emailSent });
    if (secret) {
      const token = jwt.sign(
        { sub: newUser._id.toString(), email: newUser.email, name: newUser.fullName },
        secret,
        { expiresIn: "7d" }
      );
      response.cookies.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    } else {
      console.warn("JWT_SECRET is not set; auth cookie will not be created.");
    }

    return response;
  } catch (error) {
    console.error("Profile creation error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}