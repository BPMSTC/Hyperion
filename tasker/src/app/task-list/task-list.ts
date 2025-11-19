import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskItemComponent } from '../task-item/task-item.component';
import { Task, TaskCategory } from '../models/task.model';
import { PlacesService, AutocompleteResult } from '../services/places.service';
import { TaskService } from '../services/task.service';
import { Observable } from 'rxjs';
import confetti from 'canvas-confetti';


/*
  TaskList component
  ------------------
  Purpose:
  - Provides the task entry form and renders a list of tasks using the
    TaskItemComponent so the visual format matches the standalone item.

  Persistence:
  - Tasks are stored in MongoDB via the TaskService (see services/task.service.ts).
  - All add/edit/delete/complete actions go to the database.
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

  // Search Bar Property
  searchTerm: string = '';

  // Debounce timer for location search
  private locationSearchTimeout: any;
  private editLocationSearchTimeout: any;

  // Drag and drop state
  draggedTask: Task | null = null;
  draggedIndex: number = -1;

  constructor(private taskService: TaskService, private placesService: PlacesService) {
    const today = new Date();
    this.todayDate = today.toISOString().split('T')[0];
  }

  public addTaskFromService(task: Task): Observable<Task> {
  return this.taskService.addTask(task);
  }

  public removeTask(taskId: string): Observable<void> {
    return this.taskService.deleteTask(taskId);
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

  get visibleTasks(): Task[] {
    // 1. Start with tasks filtered by completion, overdue, and category filters
    let filtered = this.filteredTasks;

    // 2. Prepare the search term (case-insensitive, trimmed)
    const term = this.searchTerm.trim().toLowerCase();

    // 3. If a search term is entered, filter further by matching title, description, or category
    if (term) {
      filtered = filtered.filter(task =>
        // Combine title, description, and category into one string for searching
        (
          task.title +
          ' ' +
          (task.description || '') +
          ' ' +
          (task.category || '')
        ).toLowerCase().includes(term)
      );
    }

    // 4. Return the final filtered and searched array
    return filtered;
  }

  ngOnInit(): void {
  this.taskService.getTasks().subscribe(tasks => {
    this.tasks = tasks;
  });
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
        // Trigger confetti animation
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

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

  // Drag and drop methods
  
  /**
   * Handles the start of a drag operation
   * - Stores which task is being dragged and its current position
   * - Creates a custom drag image showing only the dragged task (not the whole list)
   * - Adds visual feedback by applying the 'dragging' CSS class
   */
  onDragStart(event: DragEvent, task: Task, index: number): void {
    // Store the task being dragged and its index in the filtered list
    this.draggedTask = task;
    this.draggedIndex = index;
    
    if (event.dataTransfer) {
      // Tell browser this is a move operation (not copy or link)
      event.dataTransfer.effectAllowed = 'move';
      // Required for Firefox compatibility
      event.dataTransfer.setData('text/html', event.currentTarget?.toString() || '');
      
      // Create a custom drag preview to avoid showing the entire scrollable list
      const dragElement = event.currentTarget as HTMLElement;
      // Clone the task row element so we can style it independently
      const clone = dragElement.cloneNode(true) as HTMLElement;
      
      // Style the clone for the drag preview
      clone.style.position = 'absolute';
      clone.style.top = '-9999px'; // Move off-screen so it's not visible
      clone.style.width = dragElement.offsetWidth + 'px'; // Match original width
      clone.style.opacity = '0.8'; // Semi-transparent to indicate it's being dragged
      clone.style.pointerEvents = 'none'; // Don't interfere with mouse events
      
      // Temporarily add clone to DOM (required for setDragImage to work)
      document.body.appendChild(clone);
      
      // Set the clone as the drag image (what user sees while dragging)
      // Second and third params are x,y offset from cursor
      event.dataTransfer.setDragImage(clone, 0, 0);
      
      // Clean up: remove the clone after drag image is captured
      setTimeout(() => {
        document.body.removeChild(clone);
      }, 0);
    }
    
    // Add CSS class to original element for visual feedback (semi-transparent)
    (event.target as HTMLElement).classList.add('dragging');
  }

  /**
   * Handles the end of a drag operation (when user releases mouse)
   * - Removes visual feedback
   * - Clears drag state
   */
  onDragEnd(event: DragEvent): void {
    // Remove the dragging visual effect from the element
    (event.target as HTMLElement).classList.remove('dragging');
    // Clear drag state
    this.draggedTask = null;
    this.draggedIndex = -1;
  }

  /**
   * Handles drag over event (fires continuously while hovering)
   * - Prevents default behavior to allow dropping
   * - Changes cursor to indicate move operation
   */
  onDragOver(event: DragEvent): void {
    // Prevent default to allow drop (default is to reject drops)
    event.preventDefault();
    if (event.dataTransfer) {
      // Show move cursor to user
      event.dataTransfer.dropEffect = 'move';
    }
  }

  /**
   * Handles drag enter event (when dragged item enters a drop zone)
   * - Adds visual highlight to show this is a valid drop target
   * - Skips adding highlight to the element being dragged itself
   */
  onDragEnter(event: DragEvent, index: number): void {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    
    // Don't highlight the task that's currently being dragged
    if (index !== this.draggedIndex) {
      // Add CSS class to show this is a valid drop target
      target.classList.add('drag-over');
    }
  }

  /**
   * Handles drag leave event (when dragged item exits a drop zone)
   * - Removes visual highlight when no longer hovering
   */
  onDragLeave(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    // Remove the highlight CSS class
    target.classList.remove('drag-over');
  }

  /**
   * Handles drop event (when user releases mouse over a drop zone)
   * - Reorders the tasks array by moving dragged task to new position
   * - Updates task order in the database
   * - Cleans up visual feedback
   */
  onDrop(event: DragEvent, dropIndex: number): void {
    // Prevent default and stop event bubbling
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.currentTarget as HTMLElement;
    // Remove highlight from drop target
    target.classList.remove('drag-over');

    // Only reorder if we're dropping in a different position
    if (this.draggedTask && this.draggedIndex !== dropIndex) {
      // Get reference to the task being dragged
      const draggedTask = this.filteredTasks[this.draggedIndex];
      
      // Create new array to trigger change detection
      const newTasks = [...this.filteredTasks];
      // Remove task from old position
      newTasks.splice(this.draggedIndex, 1);
      // Insert task at new position
      newTasks.splice(dropIndex, 0, draggedTask);
      
      // Update the main tasks array with new order
      this.tasks = newTasks;
      
      // Persist the new order to MongoDB
      this.updateTaskOrder(newTasks);
    }
  }

  /**
   * Persists the new task order to the database
   * Note: Currently just updates each task. In production, you might want to
   * add an 'order' or 'position' field to the Task model for explicit ordering
   */
  private updateTaskOrder(tasks: Task[]): void {
    // Update each task in the database
    tasks.forEach((task, index) => {
      if (task._id) {
        // Update the task (currently no order field, but structure is here for future)
        this.taskService.updateTask(task).subscribe();
      }
    });
  }
}
