// API Types and Interfaces

// Auth Types
export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  businessCountry?: string;
  businessName?: string;
  businessDetails?: any;
  status?: UserStatus;
  role?: UserRole;
}

export type UserStatus = 'enabled' | 'disabled';
export type UserRole = 'customer' | 'admin' | 'service';

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface UserEnabledDto {
  userId: string;
  status: CodeStatusType;
}

export type CodeStatusType = 'enabled' | 'disabled';

export interface CreatedProviderDto {
  provider: PaymentProviders;
  userId: string;
}

export type PaymentProviders = 'MTN' | 'ORANGE' | 'MOOV' | 'AIRTEL' | string;

export interface ActivatedProviderDto {
  provider: PaymentProviders;
  userId: string;
  status: CodeStatusType;
}

export interface GenerateCredentialsResponse {
  apiKey: string;
  secretKey: string;
  message?: string;
}

export interface Transaction {
  id: string;
  transactionId: string;
  amount: number;
  currency: currencyOptions;
  status: PaymentStatus;
  paymentMode: PaymentMode;
  paymentType: PaymentType;
  createdAt: string;
  updatedAt: string;
  customerId?: string;
  description?: string;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'processing';
export type PaymentMode = 'live' | 'test';
export type PaymentType = 'payment' | 'refund' | 'chargeback';
export type currencyOptions = 'XAF' | 'USD' | 'EUR' | 'GBP' | string;

// Payment Types
export interface MakePaymentDto {
  amount: number;
  currency: currencyOptions;
  paymentProvider: PaymentProviders;
  phoneNumber: string;
  description?: string;
  customerId?: string;
  paymentMode?: PaymentMode;
}

export interface PaymentResponse {
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  currency: currencyOptions;
  paymentProvider: PaymentProviders;
  message?: string;
  paymentUrl?: string;
}

export interface PaymentStatusResponse {
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  currency: currencyOptions;
  paymentProvider: PaymentProviders;
  createdAt: string;
  updatedAt: string;
  description?: string;
}

export interface AccountHolderInfo {
  phoneNumber: string;
  isActive: boolean;
  provider: PaymentProviders;
}

export interface AccountHolderBasicInfo {
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  provider: PaymentProviders;
  isActive: boolean;
}

// Webhook Types
export interface MtnCallbackDto {
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  currency: currencyOptions;
  phoneNumber: string;
  timestamp: string;
  signature?: string;
}

// Log Types
export interface ApiLog {
  id: string;
  method: string;
  endpoint: string;
  status: number;
  responseTime: number;
  timestamp: string;
  userId?: string;
  requestBody?: any;
  responseBody?: any;
  ipAddress?: string;
}

// Admin Types
export interface FindUserResponse {
  user: User;
  transactions?: Transaction[];
  providers?: PaymentProviders[];
}

export interface QueueItem {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  processedAt?: string;
  data?: any;
}

// Error Types
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}


