import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, catchError, of, takeUntil } from 'rxjs';

import { TaskService } from '../../../core/services/task.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task } from '../../../core/models/task.model';
import { TaskFormComponent } from '../task-form/task-form.component';
import { TaskDetailsComponent } from '../task-details/task-details.component';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-team-tasks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DragDropModule,
    TaskFormComponent,
    TaskDetailsComponent
  ],
  templateUrl: './team-tasks.component.html',
  styleUrls: ['./team-tasks.component.css']
})
export class TeamTasksComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  completedTasks: Task[] = [];
  
  isLoading = true;
  error: string | null = null;
  
  // Selected task for viewing details
  selectedTask: Task | null = null;
  
  // Form control
  showTaskForm = false;
  taskToEdit: Task | null = null;
  
  // Filters
  searchQuery = '';
  filterStatus = 'all';
  filterPriority = 'all';
  filterAssignee = 'all';
  
  private destroy$ = new Subject<void>();

  constructor(
    private taskService: TaskService,
    private notificationService: NotificationService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadTeamTasks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // Load team tasks from service
  loadTeamTasks(): void {
    this.isLoading = true;
    this.taskService.getTeamTasks()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading team tasks:', error);
          this.notificationService.error('Failed to load team tasks');
          return of([]);
        })
      )
      .subscribe(tasks => {
        this.tasks = tasks;
        this.applyFilters();
        this.isLoading = false;
      });
  }

  // Apply filters to tasks
  applyFilters(): void {
    this.filteredTasks = this.tasks.filter(task => {
      // Status filter
      if (this.filterStatus !== 'all' && task.status !== this.filterStatus) {
        return false;
      }
      
      // Priority filter
      if (this.filterPriority !== 'all' && task.priority !== this.filterPriority) {
        return false;
      }
      
      // Assignee filter (if implemented)
      if (this.filterAssignee !== 'all' && task.assignedTo !== this.filterAssignee) {
        return false;
      }
      
      // Search query
      if (this.searchQuery.trim() !== '') {
        const query = this.searchQuery.toLowerCase();
        return (
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
    
    this.updateTaskColumns();
  }

  // Update task columns based on status
  updateTaskColumns(): void {
    this.todoTasks = this.filteredTasks.filter(task => task.status === 'todo');
    this.inProgressTasks = this.filteredTasks.filter(task => task.status === 'inProgress');
    this.completedTasks = this.filteredTasks.filter(task => task.status === 'completed');
  }
  
  // Check if any filters are active
  hasActiveFilters(): boolean {
    return (
      this.filterStatus !== 'all' ||
      this.filterPriority !== 'all' ||
      this.filterAssignee !== 'all' ||
      this.searchQuery.trim() !== ''
    );
  }
  
  // Clear filters
  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }
  
  clearStatusFilter(): void {
    this.filterStatus = 'all';
    this.applyFilters();
  }
  
  clearPriorityFilter(): void {
    this.filterPriority = 'all';
    this.applyFilters();
  }
  
  clearAssigneeFilter(): void {
    this.filterAssignee = 'all';
    this.applyFilters();
  }
  
  clearAllFilters(): void {
    this.filterStatus = 'all';
    this.filterPriority = 'all';
    this.filterAssignee = 'all';
    this.searchQuery = '';
    this.applyFilters();
  }
  
  // Task actions
  createTask(): void {
    this.taskToEdit = null;
    this.showTaskForm = true;
  }
  
  editTask(task: Task): void {
    this.taskToEdit = task;
    this.showTaskForm = true;
  }
  
  viewTaskDetails(task: Task): void {
    this.selectedTask = task;
  }
  
  closeTaskDetails(): void {
    this.selectedTask = null;
  }
  
  onTaskCreated(task: Task): void {
    this.showTaskForm = false;
    this.loadTeamTasks();
    this.notificationService.success('Task created successfully');
  }
  
  onTaskUpdated(task: Task): void {
    this.showTaskForm = false;
    this.loadTeamTasks();
    this.notificationService.success('Task updated successfully');
  }
  
  onTaskSaved(task: Task): void {
    this.showTaskForm = false;
    this.loadTeamTasks();
    this.notificationService.success(`Task ${this.taskToEdit ? 'updated' : 'created'} successfully`);
  }
  
  // Drag and drop functionality
  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      // Update the status of the moved task
      const task = event.container.data[event.currentIndex];
      let newStatus: 'todo' | 'inProgress' | 'completed';
      
      if (event.container.id === 'todo') {
        newStatus = 'todo';
      } else if (event.container.id === 'in-progress') {
        newStatus = 'inProgress';
      } else {
        newStatus = 'completed';
      }
      
      if (task.status !== newStatus) {
        this.updateTaskStatus(task, newStatus);
      }
    }
  }
  
  // Update task status
  updateTaskStatus(task: Task, newStatus: 'todo' | 'inProgress' | 'completed'): void {
    const updatedTask: Task = { ...task, status: newStatus };
    
    this.taskService.updateTask(updatedTask)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error updating task status:', error);
          this.notificationService.error('Failed to update task status');
          this.loadTeamTasks(); // Reload to revert UI changes
          return of(null);
        })
      )
      .subscribe(() => {
        // Update local data without a full reload
        const index = this.tasks.findIndex(t => t.id === task.id);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
        }
      });
  }
}
