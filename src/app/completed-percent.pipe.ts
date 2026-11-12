import { Pipe, PipeTransform } from '@angular/core';
import { FitnessTask } from './models';

@Pipe({ name: 'completedPercent' })
export class CompletedPercentPipe implements PipeTransform {
  transform(tasks: FitnessTask[]): number {
    if (!tasks || !tasks.length) return 0;
    return Math.round(tasks.filter(task => task.completed).length / tasks.length * 100);
  }
}
