export type TaskCategory = 'Workout' | 'Nutrition' | 'Wellness' | 'Personal';

export interface FitnessTask {
  id: string;
  title: string;
  time: string;
  category: TaskCategory;
  completed: boolean;
  notes: string;
}

export interface DailyRecord {
  date: string;
  tasks: FitnessTask[];
  waterGlasses: number;
  completionPercent?: number;
}

export interface AppData {
  records: { [date: string]: DailyRecord };
}
