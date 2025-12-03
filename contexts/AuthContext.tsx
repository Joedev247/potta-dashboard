'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isVerified: boolean;
  role?: string;
}

interface SignupData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (data: SignupData) => Promise<boolean>;
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (otp: string) => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dummy user data for development
const dummyUser: User = {
  id: '1',
  email: 'john.doe@example.com',
  username: 'johndoe',
  firstName: 'John',
  lastName: 'Doe',
  isVerified: true,
  role: 'customer',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(dummyUser);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedAuth = localStorage.getItem('isAuthenticated');
    
    if (storedUser && storedAuth === 'true') {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        // Fall back to dummy user
        setUser(dummyUser);
        setIsAuthenticated(true);
      }
    } else {
      // Set dummy user if no stored user
      setUser(dummyUser);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // For now, use mock authentication
      // In production, this would call your API
      if (email && password) {
        // Extract name from email for dummy data
        const emailParts = email.split('@')[0].split('.');
        const firstName = emailParts[0]?.charAt(0).toUpperCase() + emailParts[0]?.slice(1) || 'User';
        const lastName = emailParts[1]?.charAt(0).toUpperCase() + emailParts[1]?.slice(1) || '';
        
        const newUser: User = {
          id: '1',
          email,
          username: email.split('@')[0],
          firstName,
          lastName: lastName || 'Doe',
          isVerified: false,
          role: 'customer',
        };
        
        setUser(newUser);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('isAuthenticated', 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('otp');
  };

  const signup = async (data: SignupData): Promise<boolean> => {
    try {
      // For now, use mock signup
      // In production, this would call your API
      if (data.email && data.password) {
        const newUser: User = {
          id: '1',
          email: data.email,
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          isVerified: false,
        };
        
        setUser(newUser);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('isAuthenticated', 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const sendOTP = async (email: string): Promise<void> => {
    try {
      // For now, use mock OTP
      // In production, this would call your API
      const mockOTP = '123456';
      localStorage.setItem('otp', mockOTP);
      console.log(`OTP sent to ${email}: ${mockOTP}`);
    } catch (error) {
      console.error('Send OTP error:', error);
    }
  };

  const verifyOTP = async (otp: string): Promise<boolean> => {
    try {
      // For now, use mock verification
      // In production, this would call your API
      const storedOTP = localStorage.getItem('otp');
      
      if (otp === storedOTP || otp === '123456') {
        if (user) {
          const verifiedUser: User = {
            ...user,
            isVerified: true,
          };
          setUser(verifiedUser);
          localStorage.setItem('user', JSON.stringify(verifiedUser));
          localStorage.removeItem('otp');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Verify OTP error:', error);
      return false;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser: User = {
        ...user,
        ...userData,
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        signup,
        sendOTP,
        verifyOTP,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

