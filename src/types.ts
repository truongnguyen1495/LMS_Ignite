export enum AccessLevel {
  L1 = 1,
  L2 = 2,
  L3 = 3,
  L4 = 4,
  L5 = 5,
}

export const LevelNames: Record<AccessLevel, string> = {
  [AccessLevel.L1]: "Cấp 1: Customer",
  [AccessLevel.L2]: "Cấp 2: New starter",
  [AccessLevel.L3]: "Cấp 3: Junior",
  [AccessLevel.L4]: "Cấp 4: Senior",
  [AccessLevel.L5]: "Cấp 5: Core leader",
};

export enum UserRole {
  ADMIN = "admin",
  STUDENT = "student",
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  level: AccessLevel;
  isLocked: boolean;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  level: AccessLevel;
  youtubeUrl?: string;
  quiz: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizSubmission {
  id: string;
  studentId: string;
  studentName: string;
  lessonId: string;
  lessonTitle: string;
  level: AccessLevel;
  answers: number[];
  score: number;
  passed: boolean;
  submittedAt: string;
}

export interface LevelUpRequest {
  id: string;
  studentId: string;
  studentName: string;
  currentLevel: AccessLevel;
  requestedLevel: AccessLevel;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  processedAt?: string;
  comment?: string;
}

export interface SystemConfig {
  passingScore: number;
}

export interface DbSchema {
  users: User[];
  lessons: Lesson[];
  quizSubmissions: QuizSubmission[];
  levelUpRequests: LevelUpRequest[];
  config: SystemConfig;
}
