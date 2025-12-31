import { SavedPractice, Group } from "../types/swimSet";

// Shared in-memory storage for demo purposes
// In production, this would be a database
export const practices: { [userId: string]: SavedPractice[] } = {};
export const groups: { [userId: string]: Group[] } = {};

// User storage
export interface User {
  id: number;
  email: string;
  password: string; // hashed
  name: string;
  username: string;
  createdAt: string;
}

export const users: User[] = [
  {
    id: 1,
    email: "coach@example.com",
    password: "$2a$10$dummy.hash", // This would be a real hashed password
    name: "Coach Smith",
    username: "coach",
    createdAt: new Date().toISOString(),
  },
];

export let nextUserId = 2;

export function getNextUserId() {
  return nextUserId++;
}
