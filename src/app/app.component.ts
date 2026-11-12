import { Component, OnDestroy, OnInit } from '@angular/core';
import { FitnessDataService } from './fitness-data.service';
import { DailyRecord, FitnessTask, TaskCategory } from './models';

type TabName = 'Today' | 'Workout' | 'Meals' | 'History';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  activeTab: TabName = 'Today';
  selectedDate = this.todayKey();
  record!: DailyRecord;
  now = new Date();
  private clockHandle: ReturnType<typeof setInterval> | null = null;

  newTitle = '';
  newTime = '09:00';
  newCategory: TaskCategory = 'Personal';
  newNotes = '';
  editingId: string | null = null;
  formError = '';
  showTaskForm = false;
  showClearModal = false;
  showResetModal = false;

  readonly categories: TaskCategory[] = ['Workout', 'Nutrition', 'Wellness', 'Personal'];
  readonly waterGoal = 8;
  readonly waterSlots = Array(8).fill(0);
  readonly Math = Math;

  constructor(private fitnessData: FitnessDataService) {}

  ngOnInit(): void {
    this.loadDate(this.selectedDate);
    this.clockHandle = setInterval(() => this.now = new Date(), 30000);
  }

  ngOnDestroy(): void {
    if (this.clockHandle) clearInterval(this.clockHandle);
  }

  private todayKey(): string {
    const d = new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  loadDate(date: string): void {
    if (!date) return;
    const safeDate = date > this.todayKey() ? this.todayKey() : date;
    this.selectedDate = safeDate;
    this.record = this.fitnessData.getRecord(safeDate, safeDate === this.todayKey());
    this.sortTasks();
    this.cancelEdit();
  }

  get todayDate(): string { return this.todayKey(); }
  get isToday(): boolean { return this.selectedDate === this.todayKey(); }
  get isReadOnly(): boolean { return !this.isToday; }

  goToToday(): void {
    this.loadDate(this.todayKey());
    this.activeTab = 'Today';
    this.cancelEdit();
  }
  get completedCount(): number { return this.record.tasks.filter(t => t.completed).length; }
  get progress(): number { return this.record.tasks.length ? Math.round(this.completedCount / this.record.tasks.length * 100) : 0; }
  get workoutTasks(): FitnessTask[] { return this.record.tasks.filter(t => t.category === 'Workout'); }
  get mealTasks(): FitnessTask[] { return this.record.tasks.filter(t => t.category === 'Nutrition'); }
  get history(): DailyRecord[] { return this.fitnessData.getAllRecords(); }

  get categoryProgress(): Array<{ name: TaskCategory; total: number; done: number }> {
    return this.categories.map(name => {
      const tasks = this.record.tasks.filter(t => t.category === name);
      return { name, total: tasks.length, done: tasks.filter(t => t.completed).length };
    }).filter(item => item.total > 0);
  }

  get weeklyProgress(): Array<{ label: string; percent: number; date: string }> {
    const records = this.fitnessData.getAllRecords();
    const today = new Date();
    const result: Array<{ label: string; percent: number; date: string }> = [];
    for (let offset = 6; offset >= 0; offset--) {
      const day = new Date(today);
      day.setDate(today.getDate() - offset);
      const key = this.dateKey(day);
      const record = records.find(r => r.date === key);
      const percent = record
        ? (record.completionPercent !== undefined
            ? record.completionPercent
            : (record.tasks.length
                ? Math.round(record.tasks.filter(t => t.completed).length / record.tasks.length * 100)
                : 0))
        : 0;
      result.push({ label: day.toLocaleDateString(undefined, { weekday: 'short' }), percent, date: key });
    }
    return result;
  }

  get streak(): number {
    const records = this.fitnessData.getAllRecords();
    let cursor = new Date();
    let key = this.dateKey(cursor);
    let current = records.find(r => r.date === key);
    if (!current || this.recordPercent(current) < 50) {
      cursor.setDate(cursor.getDate() - 1);
      key = this.dateKey(cursor);
    }
    let count = 0;
    while (true) {
      const found = records.find(r => r.date === key);
      if (!found || this.recordPercent(found) < 50) break;
      count++;
      cursor.setDate(cursor.getDate() - 1);
      key = this.dateKey(cursor);
      if (count > 365) break;
    }
    return count;
  }

  get nextMilestone(): string {
    const hour = this.now.getHours();
    if (hour >= 6 && hour < 7) return 'Gym time is coming up. Get ready at 6:40 AM.';
    if (hour >= 7 && hour < 8) return 'Workout window: make your movement count.';
    if (hour >= 8 && hour < 10) return 'Breakfast, freshen up and wind down for sleep.';
    if (hour >= 10 && hour < 18) return 'Sleep window: protect your rest until 6 PM.';
    if (hour >= 18 && hour < 21) return 'Evening prep: eat, prepare your food and get ready for work.';
    if (hour >= 21 || hour < 6) return 'Night shift: take breaks, eat and hydrate when work allows.';
    return 'Take the next small step in your routine.';
  }

  get shiftStatus(): string {
    const hour = this.now.getHours();
    if (hour >= 21 || hour < 6) return 'ON SHIFT · 9 PM–6 AM';
    if (hour >= 6 && hour < 10) return 'POST-SHIFT · GYM & RECOVERY';
    if (hour >= 10 && hour < 18) return 'SLEEP WINDOW · 10 AM–6 PM';
    return 'PRE-SHIFT · EVENING ROUTINE';
  }

  get motivation(): string {
    if (this.progress === 100) return 'You showed up for yourself today. That is something to be proud of!';
    if (this.progress >= 70) return 'Look at your progress! Finish gently and celebrate the effort.';
    if (this.progress >= 30) return 'You have already started. One small step at a time, Nivedita.';
    return 'You do not need a perfect day. Just choose one kind action for yourself.';
  }

  private dateKey(d: Date): string {
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  private recordPercent(record: DailyRecord): number {
    return record.tasks.length ? record.tasks.filter(t => t.completed).length / record.tasks.length * 100 : 0;
  }

  setTab(tab: TabName): void { this.activeTab = tab; this.cancelEdit(); }

  toggleTask(task: FitnessTask, checked: boolean): void {
    if (this.isReadOnly) return;
    task.completed = checked;
    this.persist();
  }

  openAddForm(category?: TaskCategory): void {
    if (this.isReadOnly) return;
    this.cancelEdit();
    this.newCategory = category || 'Personal';
    this.showTaskForm = true;
  }

  saveTask(): void {
    if (this.isReadOnly) return;
    const title = this.newTitle.trim();
    if (!title) { this.formError = 'Please enter an activity name.'; return; }
    if (title.length < 2) { this.formError = 'Activity name must contain at least 2 characters.'; return; }
    if (title.length > 70) { this.formError = 'Activity name cannot exceed 70 characters.'; return; }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(this.newTime)) { this.formError = 'Please select a valid time.'; return; }
    if (this.newNotes.trim().length > 160) { this.formError = 'Notes cannot exceed 160 characters.'; return; }

    if (this.editingId) {
      const existing = this.record.tasks.find(t => t.id === this.editingId);
      if (existing) {
        existing.title = title;
        existing.time = this.newTime;
        existing.category = this.newCategory;
        existing.notes = this.newNotes.trim();
      }
    } else {
      const duplicate = this.record.tasks.some(t => t.title.toLowerCase() === title.toLowerCase() && t.category === this.newCategory);
      if (duplicate) { this.formError = 'A similar activity already exists in this category.'; return; }
      this.record.tasks.push({
        id: `task-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        title, time: this.newTime, category: this.newCategory,
        completed: false, notes: this.newNotes.trim()
      });
    }
    this.persist();
    this.cancelEdit();
  }

  editTask(task: FitnessTask): void {
    if (this.isReadOnly) return;
    this.editingId = task.id;
    this.newTitle = task.title;
    this.newTime = task.time;
    this.newCategory = task.category;
    this.newNotes = task.notes;
    this.showTaskForm = true;
    this.formError = '';
  }

  deleteTask(task: FitnessTask): void {
    if (this.isReadOnly) return;
    if (!confirm(`Delete "${task.title}" from this day?`)) return;
    this.record.tasks = this.record.tasks.filter(t => t.id !== task.id);
    this.persist();
  }

  cancelEdit(): void {
    this.editingId = null; this.newTitle = ''; this.newTime = '09:00';
    this.newCategory = 'Personal'; this.newNotes = ''; this.formError = '';
    this.showTaskForm = false;
  }

  changeWater(amount: number): void {
    if (this.isReadOnly) return;
    this.record.waterGlasses = Math.max(0, Math.min(30, this.record.waterGlasses + amount));
    this.persist();
  }

  resetDay(): void {
    if (this.isReadOnly) return;
    this.showResetModal = true;
  }

  cancelResetDay(): void {
    this.showResetModal = false;
  }

  confirmResetDay(): void {
    if (this.isReadOnly) {
      this.showResetModal = false;
      return;
    }
    this.record = this.fitnessData.resetDay(this.selectedDate);
    this.showResetModal = false;
  }

  openClearHistory(): void { this.showClearModal = true; }

  cancelClearHistory(): void { this.showClearModal = false; }

  confirmClearHistory(): void {
    this.fitnessData.clearAllData();
    this.showClearModal = false;
    this.activeTab = 'Today';
    this.loadDate(this.todayKey());
  }

  private sortTasks(): void { this.record.tasks.sort((a, b) => a.time.localeCompare(b.time)); }
  private persist(): void { this.sortTasks(); this.fitnessData.saveRecord(this.record); }

  categoryIcon(category: TaskCategory): string {
    const icons: Record<TaskCategory, string> = {
      Workout: '🏋️', Nutrition: '🥗', Wellness: '🌿', Personal: '✨'
    };
    return icons[category];
  }

  historyPercent(record: DailyRecord): number {
    return record.completionPercent !== undefined
      ? record.completionPercent
      : (record.tasks.length
          ? Math.round(record.tasks.filter(task => task.completed).length / record.tasks.length * 100)
          : 0);
  }

  formatDate(date: string): string {
    return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  trackById(_: number, task: FitnessTask): string { return task.id; }
}
