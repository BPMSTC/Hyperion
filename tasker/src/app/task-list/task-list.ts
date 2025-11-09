import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskItemComponent } from '../task-item/task-item.component';
import { Task, TaskCategory } from '../models/task.model';
import { PlacesService, AutocompleteResult } from '../services/places.service';
import { TaskService } from '../services/task.service';

/*
  TaskList component
  ------------------
  Purpose:
  - Provides the task entry form and renders a list of tasks using the
    TaskItemComponent so the visual format matches the standalone item.

  Persistence:
  - Loads tasks from localStorage on initialization and persists changes on
    add/remove/complete. This preserves the user's tasks between page reloads.

  Notes:
  - nextId is computed from existing saved tasks to avoid id collisions when
    migrating or restoring saved data.
*/
@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskItemComponent],
  templateUrl: './task-list.html',
  styleUrls: ['./task-list.css']
})
export class TaskList implements OnInit {
  // Alert state variables
  showCompleteAlert = false;
  completeMessage = '';
  isFading = false;

  // Character limit constants
  readonly TITLE_MAX_LENGTH = 50;
  readonly DESCRIPTION_MAX_LENGTH = 250;

  // available categoeries
  readonly CATEGORIES: TaskCategory[] = ['School', 'Work', 'Personal'];

  todayDate: string; // bound to the date input's min attribute

  // The in-memory array of tasks displayed in the template
  tasks: Task[] = [];




  // Form-bound properties for new task input
  newTitle = '';
  newDescription = '';
  newLocation = ''; // bound to the location input
  newDueDate = ''; // bound to the form's date input (ISO yyyy-mm-dd)
  newCategory: TaskCategory | '' = ''; // bound to the category dropdown
  locationSuggestions: AutocompleteResult[] = []; // autocomplete suggestions

  // Edit mode properties
  editingTaskId: string | null = null;
  editTitle = '';
  editDescription = '';
  editLocation = ''; // bound while editing a task location
  editDueDate = ''; // bound while editing a task
  editCategory: TaskCategory | '' = ''; // bound while editing a task category
  editLocationSuggestions: AutocompleteResult[] = []; // autocomplete suggestions for edit mode


  // Filter toggles
  filterCompleted = false; // when true, show only completed tasks
  filterOverdue = false; // when true, show only overdue tasks
  filterCategory: TaskCategory | '' = ''; // when set, show only tasks of this category
  filterOldTasks = false; // when true, show only tasks older than 30 days
  // Controls whether the filter options panel is visible
  filterPanelOpen = false;

  // Debounce timer for location search
  private locationSearchTimeout: any;
  private editLocationSearchTimeout: any;

  constructor(private taskService: TaskService, private placesService: PlacesService) {
    const today = new Date();
    this.todayDate = today.toISOString().split('T')[0];
  }

  // Computed filtered list: tasks must match all active filters
  get filteredTasks(): Task[] {
    return this.tasks.filter(t => {
      //filter by completion status
      if (t.completed !== this.filterCompleted) return false;
      
      // Filter by overdue status
      if (this.filterOverdue && !this.isTaskOverdue(t)) return false;

      //Filter by category
      if (this.filterCategory && t.category !== this.filterCategory) return false;
      return true;
    });
  }

  /*
   * On init, try to read saved tasks from localStorage and initialize
   * the in-memory list. This preserves tasks between page reloads.
   */
  ngOnInit(): void {
    this.taskService.getTasks().subscribe(tasks => {
      this.tasks = tasks;
    });
  }

  /* Save current tasks array to localStorage. Kept in one helper for reuse. */
  public saveTasks(): void {
    // No-op: persistence is handled by backend
  }

  // addTask() is wired to the form's ngSubmit. It validates input, creates
  // a Task object, prepends it to the tasks list, and clears the form fields.
  addTask(): void {
    const title = this.newTitle?.trim();
    if (!title) return;
    if (title.length > this.TITLE_MAX_LENGTH) return;
    const description = this.newDescription?.trim() || '';
    if (description.length > this.DESCRIPTION_MAX_LENGTH) return;
    const task: Task = {
      title,
      description,
      dueDate: this.newDueDate ? this.newDueDate : undefined,
      location: this.newLocation ? this.newLocation.trim() : undefined,
      category: this.newCategory || undefined,
      completed: false
    };
    this.taskService.addTask(task).subscribe(newTask => {
      this.tasks = [newTask, ...this.tasks];
      this.newTitle = '';
      this.newDescription = '';
      this.newLocation = '';
      this.newDueDate = '';
      this.newCategory = '';
      this.locationSuggestions = [];
    });
  }

 // Toggle the completed flag for a task; the checkbox in the template calls this.
toggleComplete(task: Task): void {
  task.completed = !task.completed;
  
  this.taskService.updateTask(task).subscribe(updatedTask => {
      if (task.completed) {
        this.completeMessage = `✓ Task "${task.title}" marked as complete!`;
        this.showCompleteAlert = true;
        this.isFading = false;
        
        // Auto-hide alert after 3 seconds
        setTimeout(() => {
          this.isFading = true;
          setTimeout(() => {
            this.showCompleteAlert = false;
          }, 2000); // Match the CSS transition duration
        }, 3000);
      }
    });
}

  // Remove a task by id; used by the remove button in the template.
  remove(task: Task): void {
    if (!task._id) return;
    this.taskService.deleteTask(task._id).subscribe(() => {
      this.tasks = this.tasks.filter(t => t._id !== task._id);
    });
  }

  // Update the due date for an existing task and persist the change
  updateDueDate(task: Task, isoDate: string | null): void {
    task.dueDate = isoDate || undefined;
    this.taskService.updateTask(task).subscribe();
  }

  // Start editing a task by setting edit mode and populating edit fields
  startEdit(task: Task): void {
    this.editingTaskId = task._id ?? null;
    this.editTitle = task.title;
    this.editDescription = task.description || '';
    this.editDueDate = task.dueDate || '';
    this.editLocation = task.location || '';
    this.editCategory = (task.category as TaskCategory) || '';
    this.editLocationSuggestions = [];
  }

  // Save the edited task and exit edit mode
  saveEdit(): void {
    const title = this.editTitle?.trim();
    if (!title || this.editingTaskId === null) return;
    if (title.length > this.TITLE_MAX_LENGTH) return;
    const description = this.editDescription?.trim() || '';
    if (description.length > this.DESCRIPTION_MAX_LENGTH) return;
    const task = this.tasks.find(t => t._id === this.editingTaskId);
    if (task) {
      task.title = title;
      task.description = description;
      task.dueDate = this.editDueDate ? this.editDueDate : undefined;
      task.location = this.editLocation ? this.editLocation.trim() : undefined;
      task.category = this.editCategory || undefined;
      this.taskService.updateTask(task).subscribe();
    }
    this.cancelEdit();
  }

  // Cancel editing and exit edit mode
  cancelEdit(): void {
    this.editingTaskId = null;
    this.editTitle = '';
    this.editDescription = '';
    this.editDueDate = '';
    this.editLocation = '';
    this.editCategory = '';
    this.editLocationSuggestions = [];
    // Clear any pending timeout for edit location search
    if (this.editLocationSearchTimeout) {
      clearTimeout(this.editLocationSearchTimeout);
    }
  }

  // Helper method to check if a task is being edited
  isEditing(task: Task): boolean {
    return this.editingTaskId === task._id;
  }

  // Method to check if a task is overdue
  isTaskOverdue(task: Task): boolean {
    if (!task.dueDate || task.completed) {
      return false;
    }
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }

  // Method to get ID for overdue task rows
  getOverdueRowId(task: Task): string | null {
    return this.isTaskOverdue(task) ? 'overdueTaskRow' : null;
  }

 

  // Location-related methods
  onLocationInput(event: any): void {
    const query = event.target.value;
    
    // Clear previous timeout
    if (this.locationSearchTimeout) {
      clearTimeout(this.locationSearchTimeout);
    }

    // Clear suggestions if query is too short
    if (!query || query.length < 3) {
      this.locationSuggestions = [];
      return;
    }

    // Debounce the search to avoid too many API calls
    this.locationSearchTimeout = setTimeout(() => {
      this.placesService.getPlaceAutocomplete(query).subscribe({
        next: (suggestions: AutocompleteResult[]) => {
          this.locationSuggestions = suggestions;
        },
        error: (error: any) => {
          console.error('Error getting location suggestions:', error);
          this.locationSuggestions = [];
        }
      });
    }, 300); // 300ms delay
  }

  selectLocation(suggestion: AutocompleteResult): void {
    this.newLocation = this.placesService.formatLocationDisplay(suggestion);
    this.locationSuggestions = []; // Hide suggestions
  }

  formatLocationDisplay(suggestion: AutocompleteResult): string {
    return this.placesService.formatLocationDisplay(suggestion);
  }

  // Edit location methods
  onEditLocationInput(event: any): void {
    const query = event.target.value;
    
    // Clear previous timeout
    if (this.editLocationSearchTimeout) {
      clearTimeout(this.editLocationSearchTimeout);
    }

    // Clear suggestions if query is too short
    if (!query || query.length < 3) {
      this.editLocationSuggestions = [];
      return;
    }

    // Debounce the search to avoid too many API calls
    this.editLocationSearchTimeout = setTimeout(() => {
      this.placesService.getPlaceAutocomplete(query).subscribe({
        next: (suggestions: AutocompleteResult[]) => {
          this.editLocationSuggestions = suggestions;
        },
        error: (error: any) => {
          console.error('Error getting edit location suggestions:', error);
          this.editLocationSuggestions = [];
        }
      });
    }, 300); // 300ms delay
  }

  selectEditLocation(suggestion: AutocompleteResult): void {
    this.editLocation = this.placesService.formatLocationDisplay(suggestion);
    this.editLocationSuggestions = []; // Hide suggestions
  }

  // Category helper method
  getCategoryBadgeClass (category?: TaskCategory): string { 
    if (!category) return '';

    switch (category){
      case 'School':
        return 'badge-school';
      case 'Work':
        return 'badge-work';
      case 'Personal':
        return 'badge-personal';
      default: 
        return '';
    }
  }

}
