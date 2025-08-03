import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { User, AuthState, Permission } from '@/types';

interface AuthContextType extends AuthState {
  login: (phoneNumber: string, code: string) => Promise<void>;
  register: (name: string, phoneNumber: string) => Promise<void>;
  logout: () => void;
  updateProfile: (user: Partial<User>) => void;
  requestVerificationCode: (phoneNumber: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    currentUser: null,
    isLoading: true,
    error: null,
  });

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('campshare-current-user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          isAuthenticated: true,
          currentUser: user,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        setAuthState({
          isAuthenticated: false,
          currentUser: null,
          isLoading: false,
          error: 'Session expired, please log in again',
        });
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (authState.currentUser) {
      localStorage.setItem('campshare-current-user', JSON.stringify(authState.currentUser));
    } else {
      localStorage.removeItem('campshare-current-user');
    }
  }, [authState.currentUser]);

  // Login function
  const login = async (phoneNumber: string, code: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // In a real app, this would call an API
      // For now, we'll simulate by checking localStorage
      const usersJson = localStorage.getItem('campshare-users');
      const users: User[] = usersJson ? JSON.parse(usersJson) : [];
      
      // Find user by phone number
      const user = users.find(u => u.phoneNumber === phoneNumber);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check if the user is using a temporary code
      if (!user.passwordSet && user.temporaryCode === code) {
        // Mark that the user has used their temporary code
        const updatedUser = { ...user, passwordSet: true };
        
        // Update the user in localStorage
        const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
        localStorage.setItem('campshare-users', JSON.stringify(updatedUsers));
        
        setAuthState({
          isAuthenticated: true,
          currentUser: updatedUser,
          isLoading: false,
          error: null,
        });
      } 
      // In a real app, we would verify the code here
      // For this demo, we'll assume code is correct if not using temporary code
      else {
        setAuthState({
          isAuthenticated: true,
          currentUser: user,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
    }
  };

  // Register function
  const register = async (name: string, phoneNumber: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // In a real app, this would call an API
      // For now, we'll simulate by updating localStorage
      const usersJson = localStorage.getItem('campshare-users');
      const users: User[] = usersJson ? JSON.parse(usersJson) : [];
      
      // Check if user with this phone number already exists
      if (users.some(u => u.phoneNumber === phoneNumber)) {
        throw new Error('Phone number already in use');
      }
      
      // Generate verification code
      const { generateVerificationCode } = await import('./passwordUtils');
      const verificationCode = generateVerificationCode();
      
      // Create new user
      const newUser: User = {
        id: uuidv4(),
        name,
        phoneNumber,
        permissions: ['read-only'], // Default permission
        passwordSet: false,
        temporaryCode: verificationCode,
      };
      
      // Add to users list
      const updatedUsers = [...users, newUser];
      localStorage.setItem('campshare-users', JSON.stringify(updatedUsers));
      
      // Send verification SMS
      const { sendInvitationSms } = await import('@/utils/smsService');
      await sendInvitationSms(phoneNumber, name, verificationCode);
      
      // Log in the new user
      setAuthState({
        isAuthenticated: true,
        currentUser: newUser,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      }));
    }
  };

  // Logout function
  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      currentUser: null,
      isLoading: false,
      error: null,
    });
  };

  // Update profile function
  const updateProfile = (userData: Partial<User>) => {
    if (!authState.currentUser) return;

    const updatedUser = { ...authState.currentUser, ...userData };
    
    // Update in context
    setAuthState(prev => ({
      ...prev,
      currentUser: updatedUser,
    }));
    
    // Update in users list
    const usersJson = localStorage.getItem('campshare-users');
    if (usersJson) {
      const users: User[] = JSON.parse(usersJson);
      const updatedUsers = users.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      );
      localStorage.setItem('campshare-users', JSON.stringify(updatedUsers));
    }
  };

  // Request verification code function
  const requestVerificationCode = async (phoneNumber: string): Promise<boolean> => {
    try {
      // Check if user exists
      const usersJson = localStorage.getItem('campshare-users');
      const users: User[] = usersJson ? JSON.parse(usersJson) : [];
      const user = users.find(u => u.phoneNumber === phoneNumber);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate a new verification code
      const { generateVerificationCode } = await import('./passwordUtils');
      const newCode = generateVerificationCode();
      
      // Update user with new code
      const updatedUser = { ...user, temporaryCode: newCode };
      const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
      localStorage.setItem('campshare-users', JSON.stringify(updatedUsers));
      
      // Send SMS with code
      const { sendPasswordResetSms } = await import('@/utils/smsService');
      await sendPasswordResetSms(phoneNumber, user.name, newCode);
      
      return true;
    } catch (error) {
      console.error('Failed to request verification code:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      register,
      logout,
      updateProfile,
      requestVerificationCode,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};