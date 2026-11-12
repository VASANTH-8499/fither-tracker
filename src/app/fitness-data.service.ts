import { Injectable } from '@angular/core';
import { AppData, DailyRecord, FitnessTask, TaskCategory } from './models';

@Injectable({ providedIn: 'root' })
export class FitnessDataService {
  private readonly storageKey = 'nivedita-fither-v2';

  private defaultTasks(): FitnessTask[] {
    const seed: Array<{ title: string; time: string; category: TaskCategory; notes?: string }> = [
      { title: 'Return from office', time: '06:00', category: 'Wellness', notes: 'Reach hostel, hydrate and wind down after the night shift.' },
      { title: 'Get ready for gym', time: '06:40', category: 'Wellness', notes: 'Change, prepare your water bottle and get ready.' },
      { title: 'Gym workout', time: '07:00', category: 'Workout', notes: 'Planned workout from 7:00 AM to 8:00 AM. Adjust intensity to how rested you feel.' },
      { title: 'Breakfast: 4 eggs, carrot and cucumber', time: '08:00', category: 'Nutrition', notes: 'Your planned post-workout breakfast. Adjust portions to your needs.' },
      { title: 'Freshen up and shower', time: '09:00', category: 'Wellness', notes: 'Wind down and prepare your sleep environment.' },
      { title: 'Sleep window begins', time: '10:00', category: 'Wellness', notes: 'Target sleep: 10:00 AM to 6:00 PM (8 hours).' },
      { title: 'Wake up and freshen up', time: '18:00', category: 'Wellness', notes: 'Wake up, get some light and prepare for your evening.' },
      { title: 'Hostel meal: rice', time: '18:30', category: 'Nutrition', notes: 'Have the rice meal served at the hostel.' },
      { title: 'Prepare protein-rich food bowl', time: '19:15', category: 'Nutrition', notes: 'Prepare soya chunks, sprouts, chickpeas/chana, carrot and cucumber. Cook and store food safely.' },
      { title: 'Pack food and water for office', time: '20:00', category: 'Nutrition', notes: 'Pack your meal, water bottle and anything needed for your shift.' },
      { title: 'Get ready and commute', time: '20:30', category: 'Personal', notes: 'Allow enough time to reach work before 9 PM.' },
      { title: 'Night shift starts', time: '21:00', category: 'Personal', notes: 'Work shift: 9:00 PM to 6:00 AM.' },
      { title: 'Meal break (adjust to office break)', time: '00:00', category: 'Nutrition', notes: 'Eat your packed meal when your actual break allows.' },
      { title: 'Water and movement break', time: '03:00', category: 'Wellness', notes: 'Drink water and move gently if your work allows.' },
      { title: 'Night shift ends', time: '06:00', category: 'Personal', notes: 'Finish work and head back to the hostel.' }
    ];

    return seed.map((task, index) => ({
      id: `nivedita-${index + 1}`,
      title: task.title,
      time: task.time,
      category: task.category,
      completed: false,
      notes: task.notes || ''
    }));
  }

  private readData(): AppData {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return { records: {} };
      const parsed = JSON.parse(raw) as AppData;
      return parsed && parsed.records ? parsed : { records: {} };
    } catch {
      return { records: {} };
    }
  }

  private writeData(data: AppData): void {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  getRecord(date: string, createIfMissing: boolean = true): DailyRecord {
    const data = this.readData();
    if (!data.records[date]) {
      if (!createIfMissing) {
        return { date, tasks: [], waterGlasses: 0, completionPercent: 0 };
      }
      data.records[date] = { date, tasks: this.defaultTasks(), waterGlasses: 0, completionPercent: 0 };
      this.writeData(data);
    }
    return data.records[date];
  }

  saveRecord(record: DailyRecord): void {
    const data = this.readData();
    const completionPercent = record.tasks.length
      ? Math.round(record.tasks.filter(task => task.completed).length / record.tasks.length * 100)
      : 0;
    data.records[record.date] = {
      ...record,
      tasks: record.tasks.map(task => ({ ...task })),
      completionPercent
    };
    this.writeData(data);
  }

  getAllRecords(): DailyRecord[] {
    return Object.values(this.readData().records).sort((a, b) => b.date.localeCompare(a.date));
  }

  resetDay(date: string): DailyRecord {
    const data = this.readData();
    const fresh: DailyRecord = { date, tasks: this.defaultTasks(), waterGlasses: 0, completionPercent: 0 };
    data.records[date] = fresh;
    this.writeData(data);
    return fresh;
  }

  clearAllData(): void {
    localStorage.removeItem(this.storageKey);
  }
}
