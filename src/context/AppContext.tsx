import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Event, MaintenanceTask, CleaningTask, User, Permission, EventCategory } from '@/types';
import { getCategoryColor } from '@/utils/categoryColors';
import { v4 as uuidv4 } from 'uuid';

interface AppContextType {
  // Events
  events: Event[];
  addEvent: (event: Omit<Event, 'id'>) => void;
  updateEvent: (event: Event) => void;
  deleteEvent: (id: string, currentUserName?: string) => void;
  
  // Maintenance Tasks
  maintenanceTasks: MaintenanceTask[];
  addMaintenanceTask: (task: Omit<MaintenanceTask, 'id' | 'createdAt'>) => void;
  updateMaintenanceTask: (task: MaintenanceTask) => void;
  deleteMaintenanceTask: (id: string) => void;
  
  // Cleaning Tasks
  cleaningTasks: CleaningTask[];
  addCleaningTask: (task: Omit<CleaningTask, 'id'>) => void;
  updateCleaningTask: (task: CleaningTask) => void;
  deleteCleaningTask: (id: string) => void;
  toggleCleanStatus: (id: string) => void;
  assignCleaningTask: (id: string, userId: string) => void;
  
  // Users
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUserPermissions: (userId: string, permissions: Permission[]) => void;
  deleteUser: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // For real-time syncing
  const syncIntervalRef = useRef<number | null>(null);
  const lastSyncTimeRef = useRef<number>(Date.now());
  
  // Load data from localStorage or use default values
  const [events, setEvents] = useState<Event[]>(() => {
    const savedEvents = localStorage.getItem('campshare-events');
    return savedEvents ? JSON.parse(savedEvents).map((event: Record<string, unknown>) => {
      const category = event.category as EventCategory || 'other';
      // Ensure proper date objects are created with time set to 00:00:00 for consistency
      const startDateStr = event.startDate as string || event.date as string;
      const endDateStr = event.endDate as string || event.date as string;
      
      // Create new Date objects with time component zeroed out
      const startDate = new Date(new Date(startDateStr).toDateString());
      const endDate = new Date(new Date(endDateStr).toDateString());
      
      return {
        ...event,
        startDate: startDate,
        endDate: endDate,
        category: category, // Default to 'other' for backwards compatibility
        color: event.color || getCategoryColor(category) // Use category color if no color specified
      };
    }) : [];
  });
  
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>(() => {
    const savedTasks = localStorage.getItem('campshare-maintenance');
    return savedTasks ? JSON.parse(savedTasks).map((task: Record<string, unknown>) => ({
      ...task,
      createdAt: new Date(task.createdAt as string),
      dueDate: task.dueDate ? new Date(task.dueDate as string) : undefined
    })) : [];
  });
  
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>(() => {
    const savedTasks = localStorage.getItem('campshare-cleaning');
    return savedTasks ? JSON.parse(savedTasks).map((task: Record<string, unknown>) => ({
      ...task,
      lastCleaned: task.lastCleaned ? new Date(task.lastCleaned as string) : undefined
    })) : [];
  });
  
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('campshare-users');
    return savedUsers ? JSON.parse(savedUsers) : [
      { id: uuidv4(), name: 'Admin User', phoneNumber: '+15551234567', permissions: ['admin'] },
      { id: uuidv4(), name: 'Regular User', phoneNumber: '+15559876543', permissions: ['read-only'] }
    ];
  });
  
  // Function to check for updates from localStorage
  const checkForUpdates = () => {
    // Check for events updates
    const savedEvents = localStorage.getItem('campshare-events');
    if (savedEvents) {
      try {
        const parsedEvents = JSON.parse(savedEvents).map((event: Record<string, unknown>) => {
          const startDateStr = event.startDate as string || event.date as string;
          const endDateStr = event.endDate as string || event.date as string;
          
          // Create new Date objects with time component zeroed out
          const startDate = new Date(new Date(startDateStr).toDateString());
          const endDate = new Date(new Date(endDateStr).toDateString());
          
          return {
            ...event,
            startDate: startDate,
            endDate: endDate,
            category: event.category || 'other' // Default to 'other' for backwards compatibility
          };
        });
        setEvents(parsedEvents);
      } catch (error) {
        console.error('Error parsing events from localStorage:', error);
      }
    }
    
    // Check for maintenance updates
    const savedMaintenance = localStorage.getItem('campshare-maintenance');
    if (savedMaintenance) {
      try {
        const parsedTasks = JSON.parse(savedMaintenance).map((task: Record<string, unknown>) => ({
          ...task,
          createdAt: new Date(task.createdAt as string),
          dueDate: task.dueDate ? new Date(task.dueDate as string) : undefined
        }));
        setMaintenanceTasks(parsedTasks);
      } catch (error) {
        console.error('Error parsing maintenance tasks from localStorage:', error);
      }
    }
    
    // Check for cleaning updates
    const savedCleaning = localStorage.getItem('campshare-cleaning');
    if (savedCleaning) {
      try {
        const parsedTasks = JSON.parse(savedCleaning).map((task: Record<string, unknown>) => ({
          ...task,
          lastCleaned: task.lastCleaned ? new Date(task.lastCleaned as string) : undefined
        }));
        setCleaningTasks(parsedTasks);
      } catch (error) {
        console.error('Error parsing cleaning tasks from localStorage:', error);
      }
    }
    
    // Check for users updates
    const savedUsers = localStorage.getItem('campshare-users');
    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers);
        setUsers(parsedUsers);
      } catch (error) {
        console.error('Error parsing users from localStorage:', error);
      }
    }
    
    lastSyncTimeRef.current = Date.now();
  };
  
  // Set up real-time syncing every minute
  useEffect(() => {
    // Only sync if more than 60 seconds have passed since last sync
    const syncIfNeeded = () => {
      const now = Date.now();
      if (now - lastSyncTimeRef.current >= 60000) { // 60 seconds in milliseconds
        checkForUpdates();
      }
    };
    
    // Initial sync
    checkForUpdates();
    
    // Set up interval for syncing every minute
    syncIntervalRef.current = window.setInterval(syncIfNeeded, 60000);
    
    // Clean up interval on unmount
    return () => {
      if (syncIntervalRef.current !== null) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);
  
  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('campshare-events', JSON.stringify(events));
  }, [events]);
  
  useEffect(() => {
    localStorage.setItem('campshare-maintenance', JSON.stringify(maintenanceTasks));
  }, [maintenanceTasks]);
  
  useEffect(() => {
    localStorage.setItem('campshare-cleaning', JSON.stringify(cleaningTasks));
  }, [cleaningTasks]);
  
  useEffect(() => {
    localStorage.setItem('campshare-users', JSON.stringify(users));
  }, [users]);
  
  // Events functions
  const addEvent = (event: Omit<Event, 'id'>) => {
    const newEvent = { 
      ...event, 
      id: uuidv4(),
      // Ensure we always have valid dates
      startDate: event.startDate || new Date(),
      endDate: event.endDate || event.startDate || new Date(),
      // Ensure we have a category
      category: event.category || 'other'
    };
    setEvents(prev => [...prev, newEvent]);
  };
  
  const updateEvent = (updatedEvent: Event) => {
    setEvents(prev => prev.map(event => event.id === updatedEvent.id ? updatedEvent : event));
  };
  
  const deleteEvent = (id: string, currentUserName?: string) => {
    // If currentUserName is provided, only allow deletion if the user is the creator
    setEvents(prev => {
      const eventToDelete = prev.find(event => event.id === id);
      
      // If no event found or no current user provided, or user is the creator, allow deletion
      if (!eventToDelete || !currentUserName || eventToDelete.createdBy === currentUserName) {
        return prev.filter(event => event.id !== id);
      }
      
      // Otherwise, don't modify the array (no permission to delete)
      return prev;
    });
  };
  
  // Maintenance tasks functions
  const addMaintenanceTask = (task: Omit<MaintenanceTask, 'id' | 'createdAt'>) => {
    const newTask: MaintenanceTask = { ...task, id: uuidv4(), createdAt: new Date() };
    setMaintenanceTasks(prev => [...prev, newTask]);
  };
  
  const updateMaintenanceTask = (updatedTask: MaintenanceTask) => {
    setMaintenanceTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
  };
  
  const deleteMaintenanceTask = (id: string) => {
    setMaintenanceTasks(prev => prev.filter(task => task.id !== id));
  };
  
  // Cleaning tasks functions
  const addCleaningTask = (task: Omit<CleaningTask, 'id'>) => {
    const newTask: CleaningTask = { ...task, id: uuidv4() };
    setCleaningTasks(prev => [...prev, newTask]);
  };
  
  const updateCleaningTask = (updatedTask: CleaningTask) => {
    setCleaningTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
  };
  
  const deleteCleaningTask = (id: string) => {
    setCleaningTasks(prev => prev.filter(task => task.id !== id));
  };
  
  const toggleCleanStatus = (id: string) => {
    setCleaningTasks(prev => prev.map(task => {
      if (task.id === id) {
        const newStatus = task.status === 'clean' ? 'unclean' : 'clean';
        return { 
          ...task, 
          status: newStatus,
          lastCleaned: newStatus === 'clean' ? new Date() : task.lastCleaned 
        };
      }
      return task;
    }));
  };
  
  const assignCleaningTask = (id: string, userId: string) => {
    setCleaningTasks(prev => prev.map(task => {
      if (task.id === id) {
        return { ...task, assignedTo: userId };
      }
      return task;
    }));
  };
  
  // Users functions
  const addUser = (user: Omit<User, 'id'>) => {
    const newUser = { 
      ...user, 
      id: uuidv4(), 
      permissions: user.permissions || ['read-only'],
      // We'll add a flag to indicate if the user has been invited but not yet set their password
      passwordSet: false
    };
    setUsers(prev => [...prev, newUser]);
    
    // Generate temporary password and send invitation email
    import('./passwordUtils').then(({ generateTemporaryPassword }) => {
      const temporaryPassword = generateTemporaryPassword();
      
      // Store the temporary password with the user (in a real app, this would be hashed)
      setUsers(prev => prev.map(u => 
        u.id === newUser.id ? { ...u, temporaryPassword } : u
      ));
      
      // Send invitation email
      import('../utils/emailService').then(({ sendInvitationEmail }) => {
        sendInvitationEmail(newUser.email, newUser.name, temporaryPassword)
          .then(() => console.log('Invitation email sent successfully'))
          .catch(error => console.error('Failed to send invitation email:', error));
      });
    });
  };

  const updateUserPermissions = (userId: string, permissions: Permission[]) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, permissions } : user
    ));
  };
  
  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  };
  
  return (
    <AppContext.Provider value={{
      events,
      addEvent,
      updateEvent,
      deleteEvent,
      maintenanceTasks,
      addMaintenanceTask,
      updateMaintenanceTask,
      deleteMaintenanceTask,
      cleaningTasks,
      addCleaningTask,
      updateCleaningTask,
      deleteCleaningTask,
      toggleCleanStatus,
      assignCleaningTask,
      users,
      addUser,
      updateUserPermissions,
      deleteUser
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};