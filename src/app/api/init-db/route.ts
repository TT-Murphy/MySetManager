import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "../../../lib/db";

export async function GET() {
  try {
    await initializeDatabase();
    return NextResponse.json({ message: "Database initialized successfully" });
  } catch (error) {
    console.error("Database initialization failed:", error);
    return NextResponse.json(
      { error: "Database initialization failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    return NextResponse.json({ message: "Database initialized successfully" });
  } catch (error) {
    console.error("Database initialization failed:", error);
    return NextResponse.json(
      { error: "Database initialization failed" },
      { status: 500 }
    );
  }
}
