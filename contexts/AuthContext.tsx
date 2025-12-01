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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedAuth = localStorage.getItem('isAuthenticated');
    
    if (storedUser && storedAuth === 'true') {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // For now, use mock authentication
      // In production, this would call your API
      if (email && password) {
        const newUser: User = {
          id: '1',
          email,
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

