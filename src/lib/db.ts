import { sql } from "@vercel/postgres";
import { SavedPractice, Group } from "../types/swimSet";

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  username: string;
  created_at: string;
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create practices table
    await sql`
      CREATE TABLE IF NOT EXISTS practices (
        id VARCHAR(255) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        total_yardage INTEGER NOT NULL,
        estimated_time INTEGER NOT NULL,
        difficulty INTEGER DEFAULT 0,
        group_id VARCHAR(255),
        date VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create groups table
    await sql`
      CREATE TABLE IF NOT EXISTS groups (
        id VARCHAR(255) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        member_count INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Insert demo user if not exists
    await sql`
      INSERT INTO users (id, email, password, name, username, created_at)
      VALUES (1, 'coach@example.com', '$2a$10$dummy.hash', 'Coach Smith', 'coach', CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO NOTHING;
    `;

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

// User functions
export async function createUser(
  email: string,
  password: string,
  name: string,
  username: string
) {
  const result = await sql`
    INSERT INTO users (email, password, name, username)
    VALUES (${email}, ${password}, ${name}, ${username})
    RETURNING id, email, name, username, created_at;
  `;
  return result.rows[0];
}

export async function getUserByEmail(email: string) {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email};
  `;
  return result.rows[0] as User | undefined;
}

export async function getUserByUsername(username: string) {
  const result = await sql`
    SELECT * FROM users WHERE username = ${username};
  `;
  return result.rows[0] as User | undefined;
}

// Practice functions
export async function getPracticesForUser(
  userId: number
): Promise<SavedPractice[]> {
  const result = await sql`
    SELECT * FROM practices WHERE user_id = ${userId} ORDER BY created_at DESC;
  `;
  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    totalYardage: row.total_yardage,
    estimatedTime: row.estimated_time,
    difficulty: row.difficulty,
    groupId: row.group_id,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.created_at, // Use created_at as updatedAt for now
  }));
}

export async function createPractice(
  userId: number,
  practice: Omit<SavedPractice, "createdAt">
) {
  await sql`
    INSERT INTO practices (id, user_id, title, content, total_yardage, estimated_time, difficulty, group_id, date)
    VALUES (${practice.id}, ${userId}, ${practice.title}, ${
    practice.content
  }, ${practice.totalYardage}, ${practice.estimatedTime}, ${
    practice.difficulty || 0
  }, ${practice.groupId}, ${practice.date});
  `;
}

export async function updatePractice(userId: number, practice: SavedPractice) {
  await sql`
    UPDATE practices 
    SET title = ${practice.title}, content = ${
    practice.content
  }, total_yardage = ${practice.totalYardage}, 
        estimated_time = ${practice.estimatedTime}, difficulty = ${
    practice.difficulty || 0
  }, 
        group_id = ${practice.groupId}, date = ${practice.date}
    WHERE id = ${practice.id} AND user_id = ${userId};
  `;
}

export async function deletePractice(userId: number, practiceId: string) {
  await sql`
    DELETE FROM practices WHERE id = ${practiceId} AND user_id = ${userId};
  `;
}

// Group functions
export async function getGroupsForUser(userId: number): Promise<Group[]> {
  const result = await sql`
    SELECT * FROM groups WHERE user_id = ${userId} ORDER BY created_at DESC;
  `;
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    memberCount: row.member_count,
    createdAt: row.created_at,
    userId: userId,
  }));
}

export async function createGroup(
  userId: number,
  group: Omit<Group, "createdAt">
) {
  await sql`
    INSERT INTO groups (id, user_id, name, member_count)
    VALUES (${group.id}, ${userId}, ${group.name}, ${group.memberCount});
  `;
}

export async function updateGroup(userId: number, group: Group) {
  await sql`
    UPDATE groups 
    SET name = ${group.name}, member_count = ${group.memberCount}
    WHERE id = ${group.id} AND user_id = ${userId};
  `;
}

export async function deleteGroup(userId: number, groupId: string) {
  await sql`
    DELETE FROM groups WHERE id = ${groupId} AND user_id = ${userId};
  `;
}
