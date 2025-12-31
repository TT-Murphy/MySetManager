import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { getGroupsForUser, createGroup } from "../../../lib/db";

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
    const userGroups = await getGroupsForUser(user.userId);

    return NextResponse.json({
      groups: userGroups,
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
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
    const { name, description, memberCount } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    const groupId = Date.now().toString();
    const newGroup = {
      id: groupId,
      name: name.trim(),
      description: description || "",
      memberCount: memberCount || 0,
      userId: user.userId,
    };

    await createGroup(user.userId, newGroup);

    return NextResponse.json({
      message: "Group created successfully",
      group: newGroup,
    });
  } catch (error) {
    console.error("Create group error:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}
