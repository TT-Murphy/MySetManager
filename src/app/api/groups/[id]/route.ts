import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { updateGroup, deleteGroup } from "../../../../lib/db";

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

    const { name, description, memberCount } = await request.json();
    const resolvedParams = await params;
    const groupId = resolvedParams.id;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    const updatedGroup = {
      id: groupId,
      name: name.trim(),
      description: description || "",
      memberCount: memberCount || 0,
      userId: user.userId,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(), // This will be overridden by the update function
    };

    await updateGroup(user.userId, updatedGroup);

    return NextResponse.json({
      message: "Group updated successfully",
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Update group error:", error);
    return NextResponse.json(
      { error: "Failed to update group" },
      { status: 500 }
    );
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
    const groupId = resolvedParams.id;

    await deleteGroup(user.userId, groupId);

    return NextResponse.json({
      message: "Group deleted successfully",
    });
  } catch (error) {
    console.error("Delete group error:", error);
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    );
  }
}
