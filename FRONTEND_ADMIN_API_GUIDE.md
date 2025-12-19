# Frontend Admin API Integration Guide

**Version:** 1.0  
**Last Updated:** December 2025  
**Base URL:** `http://localhost:3005/api` (Development) | `https://api.yourdomain.com/api` (Production)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base Configuration](#base-configuration)
4. [API Endpoints](#api-endpoints)
   - [User Management](#user-management)
   - [Organization Management](#organization-management)
   - [Onboarding Management](#onboarding-management)
   - [System Logs](#system-logs)
   - [Queue Monitoring](#queue-monitoring)
5. [Error Handling](#error-handling)
6. [TypeScript Types](#typescript-types)
7. [Code Examples](#code-examples)
8. [Best Practices](#best-practices)

---

## Overview

This guide provides comprehensive documentation for integrating with the Payment Service Admin API. All admin endpoints require admin role authentication and use a special `token` header (not `Authorization`).

**Key Features:**
- User management (register, enable/disable, find users)
- Organization status management
- Onboarding document verification
- Onboarding step approval
- System logs access
- Queue monitoring dashboard

---

## Authentication

### Admin Authentication Method

Admin endpoints use a **different authentication header** than regular API endpoints:

- **Header Name:** `token` (not `Authorization`)
- **Header Value:** Admin JWT token obtained from login
- **Content-Type:** `application/json`

### Getting Admin Token

Admin users must first authenticate via the login endpoint:

```typescript
// Login endpoint (uses regular authentication)
POST /api/login
Headers: {
  "Content-Type": "application/json"
}
Body: {
  "username": "admin_username",
  "password": "admin_password"
}

// Response includes token
{
  "status_code": 200,
  "status": "OK",
  "message": "Authentication successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "username": "admin_username",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

### Using Admin Token

Store the token and use it for all admin API calls:

```typescript
const adminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

fetch('https://api.example.com/api/admin/logs?page=1', {
  method: 'GET',
  headers: {
    'token': adminToken,  // ← Note: 'token' not 'Authorization'
    'Content-Type': 'application/json'
  }
});
```

---

## Base Configuration

### API Client Setup

```typescript
// api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api';

class AdminApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.token) {
      throw new Error('Admin token not set. Please login first.');
    }

    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'token': this.token,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const adminApi = new AdminApiClient(API_BASE_URL);
```

---

## API Endpoints

### User Management

**Base Path:** `/api/admin`

#### 1. Register User

Register a new internal user or service account.

**Endpoint:** `POST /api/admin/register`

**Request Body:**
```typescript
{
  username: string;        // Required, 4-30 characters, unique
  email: string;           // Required, max 30 characters, valid email, unique
  password: string;        // Required, 4-30 characters
  firstName?: string;      // Optional, 1-30 characters
  lastName?: string;       // Optional, 1-30 characters
  role: 'admin' | 'user' | 'service';  // Required
  isInternal: boolean;     // Required, default: true
}
```

**Response:**
```typescript
{
  status_code: 201;
  status: "Created";
  message: "User registered successfully";
  data: {
    id: string;
    username: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    createdAt: string;
  };
}
```

**Example:**
```typescript
const newUser = await adminApi.post('/admin/register', {
  username: 'newuser123',
  email: 'user@example.com',
  password: 'securePassword123',
  firstName: 'John',
  lastName: 'Doe',
  role: 'user',
  isInternal: true
});
```

---

#### 2. Change User Status

Enable or disable a user account.

**Endpoint:** `PUT /api/admin/change-status`

**Request Body:**
```typescript
{
  id: string;              // Required, UUID
  status: 'ACTIVE' | 'INACTIVE';  // Required
}
```

**Response:**
```typescript
{
  status_code: 200;
  status: "OK";
  message: "User status updated successfully";
  data: {
    id: string;
    status: string;
    updatedAt: string;
  };
}
```

**Example:**
```typescript
const result = await adminApi.put('/admin/change-status', {
  id: 'user-uuid-here',
  status: 'INACTIVE'
});
```

---

#### 3. Create Payment Provider

Create a new payment provider in the system.

**Endpoint:** `POST /api/admin/created-provider`

**Request Body:**
```typescript
{
  name: string;            // Required, e.g., "MTN_CAM", "ORANGE_CMR"
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';  // Required, default: "PENDING"
}
```

**Response:**
```typescript
{
  status_code: 200;
  status: "OK";
  message: "Provider created successfully";
  data: {
    id: string;
    name: string;
    status: string;
    createdAt: string;
  };
}
```

**Example:**
```typescript
const provider = await adminApi.post('/admin/created-provider', {
  name: 'MTN_CAM',
  status: 'PENDING'
});
```

---

#### 4. Activate/Deactivate Provider for User

Enable or disable a payment provider for a specific user.

**Endpoint:** `PUT /api/admin/activated-provider`

**Request Body:**
```typescript
{
  user_id: string;         // Required, UUID
  provider: string;        // Required, enum: PaymentProviders (e.g., "MTN_CAM", "ORANGE_CMR")
  status: boolean;         // Required, true = enabled, false = disabled
}
```

**Response:**
```typescript
{
  status_code: 200;
  status: "OK";
  message: "Provider status updated successfully";
  data: {
    user_id: string;
    provider: string;
    status: boolean;
    updatedAt: string;
  };
}
```

**Example:**
```typescript
const result = await adminApi.put('/admin/activated-provider', {
  user_id: 'user-uuid-here',
  provider: 'MTN_CAM',
  status: true
});
```

---

#### 5. Find User

Search for users by username, email, or ID.

**Endpoint:** `GET /api/admin/find`

**Query Parameters:**
```typescript
{
  username?: string;      // Optional
  email?: string;         // Optional, must be valid email
  id?: string;           // Optional, must be UUID
}
```

**Response:**
```typescript
{
  status_code: 200;
  status: "OK";
  message: "Users found";
  data: Array<{
    id: string;
    username: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    status: string;
    createdAt: string;
  }>;
}
```

**Example:**
```typescript
// Find by username
const users = await adminApi.get('/admin/find?username=john_doe');

// Find by email
const users = await adminApi.get('/admin/find?email=user@example.com');

// Find by ID
const users = await adminApi.get('/admin/find?id=user-uuid-here');
```

---

### Organization Management

**Base Path:** `/api/organizations/admin`

#### 1. Get Pending Organizations

Get all organizations awaiting admin review/approval.

**Endpoint:** `GET /api/organizations/admin/pending`

**Response:**
```typescript
{
  status_code: 200;
  status: "OK";
  message: "Pending organizations retrieved successfully";
  data: Array<{
    id: string;
    name: string;
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
    owner: {
      id: string;
      email: string;
      username: string;
    };
    onboardingStatus: {
      currentStep: number;
      totalSteps: number;
      completedSteps: number;
    };
    createdAt: string;
    updatedAt: string;
  }>;
}
```

**Example:**
```typescript
const pendingOrgs = await adminApi.get('/organizations/admin/pending');
```

---

#### 2. Change Organization Status

Approve, reject, suspend, or activate an organization.

**Endpoint:** `PUT /api/organizations/admin/:id/status`

**Path Parameters:**
- `id` (string, required): Organization UUID

**Request Body:**
```typescript
{
  status: 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'PENDING';  // Required
  reason?: string;         // Optional, reason for status change
  admin_notes?: string;    // Optional, additional admin notes
}
```

**Response:**
```typescript
{
  status_code: 200;
  status: "OK";
  message: "Organization status updated successfully";
  data: {
    id: string;
    name: string;
    status: string;
    reason?: string;
    admin_notes?: string;
    updatedBy: string;     // Admin user ID
    updatedAt: string;
  };
}
```

**Example:**
```typescript
const result = await adminApi.put(`/organizations/admin/${orgId}/status`, {
  status: 'ACTIVE',
  reason: 'All onboarding steps completed and verified',
  admin_notes: 'Organization verified and activated successfully'
});
```

---

### Onboarding Management

**Base Path:** `/api/onboarding/admin`

#### 1. Get Pending Documents

Get all documents awaiting admin verification.

**Endpoint:** `GET /api/onboarding/admin/documents/pending`

**Response:**
```typescript
{
  status_code: 200;
  status: "OK";
  message: "Pending documents retrieved successfully";
  data: Array<{
    id: string;
    organizationId: string;
    organizationName: string;
    documentType: string;      // e.g., "BUSINESS_LICENSE", "TAX_ID", "BANK_STATEMENT"
    fileUrl: string;
    verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    uploadedAt: string;
    organization: {
      id: string;
      name: string;
      owner: {
        email: string;
        username: string;
      };
    };
  }>;
}
```

**Example:**
```typescript
const pendingDocs = await adminApi.get('/onboarding/admin/documents/pending');
```

---

#### 2. Verify Document

Approve or reject a document submitted during onboarding.

**Endpoint:** `PUT /api/onboarding/admin/documents/:id/verify`

**Path Parameters:**
- `id` (string, required): Document UUID

**Request Body:**
```typescript
{
  status: 'APPROVED' | 'REJECTED';  // Required
  rejection_reason?: string;       // Optional, recommended if REJECTED
  admin_notes?: string;            // Optional, additional admin notes
}
```

**Response:**
```typescript
{
  status_code: 200;
  status: "OK";
  message: "Document verification updated successfully";
  data: {
    id: string;
    verificationStatus: 'APPROVED' | 'REJECTED';
    verifiedBy: string;            // Admin user ID
    verifiedAt: string;
    rejection_reason?: string;
    admin_notes?: string;
  };
}
```

**Example:**
```typescript
// Approve document
const result = await adminApi.put(`/onboarding/admin/documents/${docId}/verify`, {
  status: 'APPROVED',
  admin_notes: 'Document verified successfully'
});

// Reject document
const result = await adminApi.put(`/onboarding/admin/documents/${docId}/verify`, {
  status: 'REJECTED',
  rejection_reason: 'Document is unclear or expired',
  admin_notes: 'Please upload a clearer copy'
});
```

---

#### 3. Get Pending Onboarding Steps

Get all onboarding steps awaiting admin approval.

**Endpoint:** `GET /api/onboarding/admin/steps/pending`

**Response:**
```typescript
{
  status_code: 200;
  status: "OK";
  message: "Pending onboarding steps retrieved successfully";
  data: Array<{
    id: string;
    organizationId: string;
    organizationName: string;
    stepNumber: number;
    stepName: string;
    stepDescription: string;
    adminApproved: boolean | null;  // null = pending
    completedAt: string;
    organization: {
      id: string;
      name: string;
      status: string;
      owner: {
        email: string;
        username: string;
      };
    };
  }>;
}
```

**Example:**
```typescript
const pendingSteps = await adminApi.get('/onboarding/admin/steps/pending');
```

---

#### 4. Approve Onboarding Step

Approve or reject an onboarding step.

**Endpoint:** `PUT /api/onboarding/admin/steps/:id/approve`

**Path Parameters:**
- `id` (string, required): Onboarding Step UUID

**Request Body:**
```typescript
{
  approved?: boolean;             // Optional, default: true
  rejection_reason?: string;      // Optional, recommended if approved = false
  admin_notes?: string;          // Optional, additional admin notes
}
```

**Response:**
```typescript
{
  status_code: 200;
  status: "OK";
  message: "Onboarding step approval updated successfully";
  data: {
    id: string;
    stepNumber: number;
    stepName: string;
    adminApproved: boolean;
    approvedBy: string;           // Admin user ID
    approvedAt: string;
    rejection_reason?: string;
    admin_notes?: string;
  };
}
```

**Example:**
```typescript
// Approve step
const result = await adminApi.put(`/onboarding/admin/steps/${stepId}/approve`, {
  approved: true,
  admin_notes: 'Step approved after review'
});

// Reject step
const result = await adminApi.put(`/onboarding/admin/steps/${stepId}/approve`, {
  approved: false,
  rejection_reason: 'Incomplete information provided',
  admin_notes: 'Please complete all required fields'
});
```

---

### System Logs

**Base Path:** `/api/admin/logs`

#### 1. Get Logs (Paginated)

Get all system request logs with pagination.

**Endpoint:** `GET /api/admin/logs`

**Query Parameters:**
```typescript
{
  page: number;          // Required, page number (starts at 1)
  limit?: number;       // Optional, default: 10, max items per page
}
```

**Response:**
```typescript
{
  status_code: 200;
  status: "OK";
  message: "Logs found";
  data: {
    logs: Array<{
      id: string;
      request: {
        method: string;
        url: string;
        headers: Record<string, string>;
        body?: any;
      };
      response: {
        statusCode: number;
        body?: any;
      };
      executionTime: string;    // e.g., "125ms"
      createdAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

**Example:**
```typescript
const logs = await adminApi.get('/admin/logs?page=1&limit=20');
```

---

#### 2. Get Log by ID

Get detailed information about a specific log entry.

**Endpoint:** `GET /api/admin/logs/:id`

**Path Parameters:**
- `id` (string, required): Log UUID

**Response:**
```typescript
{
  status_code: 200;
  status: "OK";
  message: "Log found";
  data: {
    id: string;
    request: {
      method: string;
      url: string;
      headers: Record<string, string>;
      body?: any;
      query?: Record<string, string>;
    };
    response: {
      statusCode: number;
      headers: Record<string, string>;
      body?: any;
    };
    executionTime: string;
    userAgent?: string;
    ipAddress?: string;
    createdAt: string;
  };
}
```

**Example:**
```typescript
const log = await adminApi.get(`/admin/logs/${logId}`);
```

---

### Queue Monitoring

**Base Path:** `/api/admin/queues`

#### Queue Dashboard

Access the Bull Board queue monitoring dashboard.

**Endpoint:** `GET /api/admin/queues`

**Note:** This endpoint serves a web-based dashboard UI. Access it directly in a browser or embed it in an iframe.

**Available Queues:**
- `statusQueue` - Payment status processing queue
- `reconsiliationQueue` - Reconciliation processing queue

**Example:**
```typescript
// In a browser or iframe
window.open('https://api.example.com/api/admin/queues', '_blank');
```

---

## Error Handling

### Standard Error Response Format

All endpoints return errors in a consistent format:

```typescript
{
  status_code: number;        // HTTP status code
  status: string;            // Status text (e.g., "Bad Request", "Unauthorized")
  message: string;           // Human-readable error message
  data?: any;                // Additional error details (optional)
}
```

### Common HTTP Status Codes

- **200 OK** - Request successful
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid request data
- **401 Unauthorized** - Missing or invalid admin token
- **403 Forbidden** - User doesn't have admin role
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource already exists (e.g., duplicate username/email)
- **500 Internal Server Error** - Server error

### Error Handling Example

```typescript
try {
  const result = await adminApi.post('/admin/register', userData);
  console.log('Success:', result);
} catch (error) {
  if (error.message.includes('401')) {
    // Token expired or invalid - redirect to login
    console.error('Unauthorized - please login again');
    // Redirect to login page
  } else if (error.message.includes('403')) {
    // User doesn't have admin role
    console.error('Forbidden - admin access required');
  } else if (error.message.includes('409')) {
    // Duplicate resource
    console.error('User already exists');
  } else {
    // Other errors
    console.error('Error:', error.message);
  }
}
```

---

## TypeScript Types

### Complete Type Definitions

```typescript
// types/admin-api.ts

export interface ApiResponse<T> {
  status_code: number;
  status: string;
  message: string;
  data: T;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// User Management Types
export interface RegisterUserRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'user' | 'service';
  isInternal: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt?: string;
}

export interface ChangeUserStatusRequest {
  id: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CreateProviderRequest {
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}

export interface ActivateProviderRequest {
  user_id: string;
  provider: string;
  status: boolean;
}

export interface FindUserQuery {
  username?: string;
  email?: string;
  id?: string;
}

// Organization Management Types
export interface Organization {
  id: string;
  name: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  owner: {
    id: string;
    email: string;
    username: string;
  };
  onboardingStatus?: {
    currentStep: number;
    totalSteps: number;
    completedSteps: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChangeOrganizationStatusRequest {
  status: 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'PENDING';
  reason?: string;
  admin_notes?: string;
}

// Onboarding Types
export interface Document {
  id: string;
  organizationId: string;
  organizationName: string;
  documentType: string;
  fileUrl: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedAt: string;
  organization: {
    id: string;
    name: string;
    owner: {
      email: string;
      username: string;
    };
  };
}

export interface VerifyDocumentRequest {
  status: 'APPROVED' | 'REJECTED';
  rejection_reason?: string;
  admin_notes?: string;
}

export interface OnboardingStep {
  id: string;
  organizationId: string;
  organizationName: string;
  stepNumber: number;
  stepName: string;
  stepDescription: string;
  adminApproved: boolean | null;
  completedAt: string;
  organization: {
    id: string;
    name: string;
    status: string;
    owner: {
      email: string;
      username: string;
    };
  };
}

export interface ApproveStepRequest {
  approved?: boolean;
  rejection_reason?: string;
  admin_notes?: string;
}

// Log Types
export interface Log {
  id: string;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
    query?: Record<string, string>;
  };
  response: {
    statusCode: number;
    headers?: Record<string, string>;
    body?: any;
  };
  executionTime: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface LogsQuery {
  page: number;
  limit?: number;
}
```

---

## Code Examples

### Complete React Hook Example

```typescript
// hooks/useAdminApi.ts
import { useState, useCallback } from 'react';
import { adminApi } from '../api-client';
import type { ApiResponse, User, Organization, Document, OnboardingStep, Log } from '../types/admin-api';

export function useAdminApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerUser = useCallback(async (userData: RegisterUserRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.post<ApiResponse<User>>('/admin/register', userData);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const changeUserStatus = useCallback(async (userId: string, status: 'ACTIVE' | 'INACTIVE') => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.put<ApiResponse<User>>('/admin/change-status', {
        id: userId,
        status
      });
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPendingOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.get<ApiResponse<Organization[]>>('/organizations/admin/pending');
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const changeOrganizationStatus = useCallback(async (
    orgId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'PENDING',
    reason?: string,
    adminNotes?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.put<ApiResponse<Organization>>(
        `/organizations/admin/${orgId}/status`,
        { status, reason, admin_notes: adminNotes }
      );
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPendingDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.get<ApiResponse<Document[]>>('/onboarding/admin/documents/pending');
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyDocument = useCallback(async (
    docId: string,
    status: 'APPROVED' | 'REJECTED',
    rejectionReason?: string,
    adminNotes?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.put<ApiResponse<Document>>(
        `/onboarding/admin/documents/${docId}/verify`,
        { status, rejection_reason: rejectionReason, admin_notes: adminNotes }
      );
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPendingSteps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.get<ApiResponse<OnboardingStep[]>>('/onboarding/admin/steps/pending');
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveStep = useCallback(async (
    stepId: string,
    approved: boolean = true,
    rejectionReason?: string,
    adminNotes?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.put<ApiResponse<OnboardingStep>>(
        `/onboarding/admin/steps/${stepId}/approve`,
        { approved, rejection_reason: rejectionReason, admin_notes: adminNotes }
      );
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getLogs = useCallback(async (page: number = 1, limit: number = 10) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.get<ApiResponse<{ logs: Log[]; pagination: any }>>(
        `/admin/logs?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    registerUser,
    changeUserStatus,
    getPendingOrganizations,
    changeOrganizationStatus,
    getPendingDocuments,
    verifyDocument,
    getPendingSteps,
    approveStep,
    getLogs,
  };
}
```

### React Component Example

```typescript
// components/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAdminApi } from '../hooks/useAdminApi';
import type { Organization, Document, OnboardingStep } from '../types/admin-api';

export function AdminDashboard() {
  const {
    loading,
    error,
    getPendingOrganizations,
    changeOrganizationStatus,
    getPendingDocuments,
    verifyDocument,
    getPendingSteps,
    approveStep,
  } = useAdminApi();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [orgs, docs, stps] = await Promise.all([
        getPendingOrganizations(),
        getPendingDocuments(),
        getPendingSteps(),
      ]);
      setOrganizations(orgs);
      setDocuments(docs);
      setSteps(stps);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleApproveOrg = async (orgId: string) => {
    try {
      await changeOrganizationStatus(orgId, 'ACTIVE', 'All requirements met');
      await loadData(); // Refresh data
    } catch (err) {
      console.error('Failed to approve organization:', err);
    }
  };

  const handleVerifyDocument = async (docId: string, approved: boolean) => {
    try {
      await verifyDocument(
        docId,
        approved ? 'APPROVED' : 'REJECTED',
        approved ? undefined : 'Document does not meet requirements',
        approved ? 'Verified successfully' : 'Please resubmit'
      );
      await loadData(); // Refresh data
    } catch (err) {
      console.error('Failed to verify document:', err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Admin Dashboard</h1>
      
      <section>
        <h2>Pending Organizations ({organizations.length})</h2>
        {organizations.map(org => (
          <div key={org.id}>
            <h3>{org.name}</h3>
            <p>Status: {org.status}</p>
            <button onClick={() => handleApproveOrg(org.id)}>
              Approve
            </button>
          </div>
        ))}
      </section>

      <section>
        <h2>Pending Documents ({documents.length})</h2>
        {documents.map(doc => (
          <div key={doc.id}>
            <h3>{doc.documentType}</h3>
            <p>Organization: {doc.organizationName}</p>
            <button onClick={() => handleVerifyDocument(doc.id, true)}>
              Approve
            </button>
            <button onClick={() => handleVerifyDocument(doc.id, false)}>
              Reject
            </button>
          </div>
        ))}
      </section>

      <section>
        <h2>Pending Steps ({steps.length})</h2>
        {steps.map(step => (
          <div key={step.id}>
            <h3>{step.stepName}</h3>
            <p>Organization: {step.organizationName}</p>
            <button onClick={() => approveStep(step.id, true)}>
              Approve
            </button>
            <button onClick={() => approveStep(step.id, false)}>
              Reject
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
```

---

## Best Practices

### 1. Token Management

- **Store tokens securely**: Use secure storage (e.g., httpOnly cookies, secure localStorage with encryption)
- **Handle token expiration**: Implement token refresh logic or redirect to login when 401 occurs
- **Never expose tokens**: Don't log tokens or include them in error messages

```typescript
// Store token securely
localStorage.setItem('admin_token', token);
adminApi.setToken(token);

// Check token expiration
if (isTokenExpired(token)) {
  // Redirect to login or refresh token
  window.location.href = '/admin/login';
}
```

### 2. Error Handling

- **Always handle errors**: Use try-catch blocks for all API calls
- **Show user-friendly messages**: Translate technical errors to user-friendly messages
- **Log errors**: Log errors for debugging but don't expose sensitive information

```typescript
try {
  const result = await adminApi.post('/admin/register', userData);
  showSuccess('User registered successfully');
} catch (error: any) {
  if (error.message.includes('409')) {
    showError('Username or email already exists');
  } else {
    showError('Failed to register user. Please try again.');
  }
  console.error('Registration error:', error);
}
```

### 3. Loading States

- **Show loading indicators**: Provide visual feedback during API calls
- **Disable actions during loading**: Prevent duplicate submissions

```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  if (loading) return; // Prevent duplicate submissions
  setLoading(true);
  try {
    await adminApi.post('/admin/register', data);
  } finally {
    setLoading(false);
  }
};
```

### 4. Data Validation

- **Validate on frontend**: Validate data before sending to API
- **Handle validation errors**: Display field-specific validation errors

```typescript
const validateUserData = (data: RegisterUserRequest): string[] => {
  const errors: string[] = [];
  if (!data.username || data.username.length < 4) {
    errors.push('Username must be at least 4 characters');
  }
  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Invalid email address');
  }
  if (!data.password || data.password.length < 4) {
    errors.push('Password must be at least 4 characters');
  }
  return errors;
};
```

### 5. Pagination

- **Implement pagination**: For large datasets, use pagination
- **Show pagination controls**: Provide UI for navigating pages

```typescript
const [page, setPage] = useState(1);
const [limit] = useState(20);

const loadLogs = async () => {
  const response = await adminApi.get(`/admin/logs?page=${page}&limit=${limit}`);
  setLogs(response.data.logs);
  setPagination(response.data.pagination);
};
```

### 6. Type Safety

- **Use TypeScript**: Leverage TypeScript for type safety
- **Define interfaces**: Create interfaces for all request/response types
- **Validate at runtime**: Consider runtime validation (e.g., Zod, Yup)

---

## Support

For questions or issues:
- **API Documentation**: See `API_DOCUMENTATION.md` for complete API reference
- **Authentication Guide**: See `AUTHENTICATION_GUIDE.md` for authentication details
- **Technical Support**: Contact the backend team

---

**Last Updated:** December 2025  
**Document Version:** 1.0


