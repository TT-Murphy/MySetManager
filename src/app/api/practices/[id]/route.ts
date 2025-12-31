import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { updatePractice, deletePractice } from "../../../../lib/db";

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const practiceId = resolvedParams.id;

    await deletePractice(user.userId, practiceId);

    return NextResponse.json({
      message: "Practice deleted successfully",
    });
  } catch (error) {
    console.error("DELETE practice error:", error);
    return NextResponse.json(
      { error: "Failed to delete practice" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const practiceId = resolvedParams.id;
    const {
      title,
      content,
      totalYardage,
      estimatedTime,
      difficulty,
      groupId,
      date,
    } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const updatedPractice = {
      id: practiceId,
      title,
      content,
      totalYardage: totalYardage || 0,
      estimatedTime: estimatedTime || 0,
      difficulty: difficulty || 0,
      groupId: groupId || null,
      date: date || new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(), // This will be overridden by the update function
    };

    await updatePractice(user.userId, updatedPractice);

    return NextResponse.json({
      message: "Practice updated successfully",
      practice: updatedPractice,
    });
  } catch (error) {
    console.error("UPDATE practice error:", error);
    return NextResponse.json(
      { error: "Failed to update practice" },
      { status: 500 }
    );
  }
}
