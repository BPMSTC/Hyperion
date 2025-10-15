import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../models/task.model';

@Component({
  selector: 'app-task-item',
  standalone: true, //This component does not need to be declared in a module; it manages its own dependencies.
  //Since it's standalone, it must import its own dependencies like directives.
  imports: [CommonModule], 
  templateUrl: './task-item.html', 
})

export class TaskItemComponent {
  //This tells Angular that task is passed in from the parent component.
  @Input() task!: Task;  // note the ! tells TS this will always be set
}