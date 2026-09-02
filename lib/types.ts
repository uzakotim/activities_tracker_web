export interface UserProfile {
  id: string;
  tokenIdentifier: string;
  name: string;
  email: string;
  pictureUrl?: string;
}

export interface ActivityItem {
  _id: string;
  _creationTime: number;
  userId: string;
  name: string;
  category: string;
  categoryColor: string;
  categoryIcon: string;
  startTime: number;
  endTime: number;
  duration: number; // in seconds
  date: string; // YYYY-MM-DD
  year: number;
  month: number;
  day: number;
  notes?: string;
}

export interface ActiveSession {
  _id: string;
  userId: string;
  activityName: string;
  category: string;
  categoryColor: string;
  categoryIcon: string;
  startedAt: number;
  isPaused: boolean;
  pausedAt?: number;
  accumulatedSeconds: number;
}

export interface CategoryStat {
  name: string;
  color: string;
  icon: string;
  seconds: number;
  count: number;
  hours: number;
  percentage: number;
  activities: { name: string; seconds: number }[];
}

export interface RecentActivityMemory {
  name: string;
  category: string;
  categoryColor: string;
  categoryIcon: string;
  frequency: number;
  lastUsedAt: number;
}
