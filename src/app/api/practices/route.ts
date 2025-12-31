import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import {
  getPracticesForUser,
  createPractice,
  updatePractice,
} from "../../../lib/db";

function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "demo-secret"
    ) as any;

    return decoded;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const user = verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const practices = await getPracticesForUser(user.userId);

    return NextResponse.json({
      practices: practices,
    });
  } catch (error) {
    console.error("Error fetching practices:", error);
    return NextResponse.json(
      { error: "Failed to fetch practices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const {
      title,
      date,
      content,
      totalYardage,
      estimatedTime,
      difficulty,
      groupId,
    } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const practiceId = Date.now().toString();
    const newPractice = {
      id: practiceId,
      title,
      date: date || new Date().toISOString().split("T")[0],
      content,
      totalYardage: totalYardage || 0,
      estimatedTime: estimatedTime || 0,
      difficulty: difficulty || 0,
      groupId: groupId || null,
      updatedAt: new Date().toISOString(),
    };

    await createPractice(user.userId, newPractice);

    return NextResponse.json({
      message: "Practice saved successfully",
      practice: newPractice,
    });
  } catch (error) {
    console.error("Save practice error:", error);
    return NextResponse.json(
      { error: "Failed to save practice" },
      { status: 500 }
    );
  }
}
