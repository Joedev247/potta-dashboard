'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  businessCountry?: string;
  businessName?: string;
  businessDetails?: any;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: SignupData) => Promise<boolean>;
  logout: () => void;
  verifyOTP: (otp: string) => Promise<boolean>;
  sendOTP: (email: string) => Promise<boolean>;
  isAuthenticated: boolean;
  otpSent: boolean;
}

interface SignupData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dummy users database
const dummyUsers: Array<User & { password: string }> = [
  {
    id: '1',
    username: 'john_doe',
    email: 'test@mollie-test.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'password123',
    isVerified: false,
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [storedOTP, setStoredOTP] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const foundUser = dummyUsers.find(u => u.email === email && u.password === password);
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const signup = async (userData: SignupData): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if user already exists
    if (dummyUsers.find(u => u.email === userData.email || u.username === userData.username)) {
      return false;
    }

    const newUser: User & { password: string } = {
      id: String(dummyUsers.length + 1),
      ...userData,
      isVerified: false,
    };

    dummyUsers.push(newUser);
    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    return true;
  };

  const sendOTP = async (email: string): Promise<boolean> => {
    // Simulate sending OTP
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Use fixed test code for easy testing
    const otp = '123456';
    setStoredOTP(otp);
    setOtpSent(true);
    
    // Store OTP in localStorage for demo purposes
    localStorage.setItem('otp', otp);
    localStorage.setItem('otpEmail', email);
    
    console.log('OTP sent to', email, ':', otp); // For demo purposes
    
    return true;
  };

  const verifyOTP = async (otp: string): Promise<boolean> => {
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const storedOTPValue = localStorage.getItem('otp');
    if (storedOTPValue === otp) {
      if (user) {
        const updatedUser = { ...user, isVerified: true };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.removeItem('otp');
        localStorage.removeItem('otpEmail');
        setOtpSent(false);
        return true;
      }
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setOtpSent(false);
    localStorage.removeItem('user');
    localStorage.removeItem('otp');
    localStorage.removeItem('otpEmail');
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        verifyOTP,
        sendOTP,
        isAuthenticated: !!user,
        otpSent,
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

