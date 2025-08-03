import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Notification, NotificationType, Permission } from '@/types';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  addChefNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const savedNotifications = localStorage.getItem('notifications');
    return savedNotifications 
      ? JSON.parse(savedNotifications, (key, value) => {
          if (key === 'timestamp') return new Date(value);
          return value;
        })
      : [];
  });

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter(notification => !notification.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Example initial maintenance notifications for demonstration
  useEffect(() => {
    if (notifications.length === 0) {
      // Add some sample notifications for maintenance tasks
      const sampleNotifications = [
        {
          title: 'Maintenance Required',
          message: 'Cabin #3 needs roof repair before next weekend',
          type: 'warning' as const,
          link: '/maintenance'
        },
        {
          title: 'Water System Check',
          message: 'Quarterly water system inspection is due this week',
          type: 'info' as const,
          link: '/maintenance'
        },
        {
          title: 'Cleaning Schedule Updated',
          message: 'New cleaning rotation has been posted for August',
          type: 'success' as const,
          link: '/cleaning'
        }
      ];
      
      sampleNotifications.forEach(notification => {
        addNotification(notification);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to add notification specifically for users with chef permission
  const addChefNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
      forPermission: 'chef' // Mark this notification specifically for chefs
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      addChefNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
};