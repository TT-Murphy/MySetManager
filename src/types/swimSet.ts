// Type definitions for swim set parsing

export interface Exercise {
  type: "exercise";
  reps: number;
  distance: number;
  stroke: string;
  specifications?: string;
  pace: string;
  interval: number;
  totalYardage: number;
  estimatedTime: number;
  originalText: string;
}

export interface Rest {
  type: "rest";
  duration: number;
  originalText: string;
}

export interface Comment {
  type: "comment";
  text: string;
}

export interface SwimSet {
  multiplier: number;
  exercises: (Exercise | Rest | Comment)[];
  yardage: number;
  estimatedTime: number;
}

export interface ParsedSwimSet {
  sets: SwimSet[];
  totalYardage: number;
  estimatedTime: number;
  difficulty: number; // 0-100 scale
  comments: string[];
}

// Group management types
export interface Group {
  id: string;
  name: string;
  memberCount: number;
  createdAt: string;
  userId: number;
}

export interface SavedPractice {
  id: string;
  title: string;
  date: string;
  content: string;
  totalYardage: number;
  estimatedTime: number;
  difficulty: number;
  groupId?: string; // Optional group assignment
  createdAt: string;
  updatedAt: string;
}
