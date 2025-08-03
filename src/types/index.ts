// Define types for the app

// Event categories
export type EventCategory = 'retreat' | 'camp' | 'day-off' | 'appointment' | 'other';

// Notification types
export type NotificationType = 'info' | 'warning' | 'error' | 'success';

// Notification interface
export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: NotificationType;
  link?: string;
  forPermission?: Permission; // Indicates if the notification is meant for users with specific permission
}

// Event type for calendar
export interface Event {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  arrivalTime?: string; // Time of arrival on start date
  departureTime?: string; // Time of departure on end date
  description?: string;
  createdBy: string;
  color?: string; // For color coordination
  category: EventCategory; // Category of the event
  cateringNeeded?: boolean; // Flag to indicate if catering is needed for retreat events
  cateringNotes?: string; // Additional notes for the chef
}

// Maintenance task type
export interface MaintenanceTask {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo?: string;
  createdAt: Date;
  dueDate?: Date;
  photos?: string[]; // Array of photo data URLs
}

// Cleaning task type
export interface CleaningTask {
  id: string;
  area: string;
  description?: string;
  status: 'clean' | 'unclean';
  assignedTo?: string;
  lastCleaned?: Date;
}

// Permission type
export type Permission = 'admin' | 'maintenance' | 'cleaning' | 'calendar' | 'read-only' | 'chef';

// User type
export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string; // Made optional
  permissions: Permission[];
  passwordSet?: boolean;
  temporaryPassword?: string;
  temporaryCode?: string; // For SMS verification
}

// Authentication type
export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}