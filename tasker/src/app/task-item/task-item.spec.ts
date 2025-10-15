import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskItemComponent } from './task-item.component';

import { Task } from '../models/task.model';

describe('TaskItem', () => {
  let component: TaskItemComponent;
  let fixture: ComponentFixture<TaskItemComponent>;

 // 1️⃣ Configure TestBed
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskItemComponent]
    }).compileComponents();
  });

  // 2️⃣ Create component, assign mock task, detect changes
  beforeEach(() => {
    fixture = TestBed.createComponent(TaskItemComponent);
    component = fixture.componentInstance;

    // Provide a mock task BEFORE detectChanges
    component.task = { title: 'Test Task', description: 'Task description' } as Task;

    fixture.detectChanges(); // now Angular can safely render the template
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
