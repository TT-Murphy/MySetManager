import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const users = [
  {
    id: 1,
    email: "coach@example.com",
    password: "$2a$10$dummy.hash",
    name: "Coach Smith",
  },
];

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No valid token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "demo-secret"
    ) as any;

    const user = users.find((u) => u.id === decoded.userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
