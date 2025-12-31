import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import {
  createUser,
  getUserByEmail,
  getUserByUsername,
} from "../../../../lib/db";

export async function POST(request: NextRequest) {
  try {
    const { name, username, email, password } = await request.json();

    // Validate required fields
    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { error: "Name, username, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmailUser = await getUserByEmail(email);
    if (existingEmailUser) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 }
      );
    }

    // Check if username already exists
    const existingUsernameUser = await getUserByUsername(username);
    if (existingUsernameUser) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user in database
    const newUser = await createUser(email, hashedPassword, name, username);

    console.log("New user created:", {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
    });

    // Create JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || "demo-secret",
      { expiresIn: "24h" }
    );

    return NextResponse.json({
      message: "Account created successfully",
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        username: newUser.username,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
