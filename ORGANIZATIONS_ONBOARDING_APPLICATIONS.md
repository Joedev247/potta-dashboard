# Organizations, Onboarding, and Applications - Relationship Documentation

**Version:** 1.0  
**Date:** December 2025  
**Audience:** Frontend Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Entity Relationships](#entity-relationships)
4. [Module Interactions](#module-interactions)
5. [Common Workflows](#common-workflows)
6. [Admin Verification & Approval](#admin-verification--approval)
7. [API Endpoints Reference](#api-endpoints-reference)
8. [Important Considerations](#important-considerations)
9. [Data Flow Diagrams](#data-flow-diagrams)

---

## Overview

The payment service has three interconnected modules that work together to support business operations:

- **Organizations**: Represent business entities (companies, merchants, etc.)
- **Onboarding**: Manages the KYC/verification process for users and organizations
- **Applications**: API credentials and configurations for payment processing

### Key Relationships

```
User
  ├── Can own ONE Organization (1:1)
  ├── Can own Applications (1:many)
  ├── Has Onboarding Steps (1:many)
  └── Has Documents (1:many)

Organization
  ├── Owned by User (1:1, unique)
  ├── Can own Applications (1:many)
  ├── Has Onboarding Steps (1:many)
  └── Has Documents (1:many)

Application
  ├── Owned by User OR Organization (many:1, exclusive)
  └── Processes Payments (1:many)
```

---

## Core Concepts

### 1. Organizations

**Purpose:** Represent business entities that use the payment service.

**Key Features:**
- Each organization has an **owner** (User) who created it
- Organizations can have **members** (multiple Users)
- Organizations have a **status** (PENDING, ACTIVE, INACTIVE, SUSPENDED)
- Organizations store business information (registration number, VAT, address, etc.)

**Use Cases:**
- A merchant wants to accept payments for their business
- Multiple team members need to manage the same business account
- Business needs separate applications for different products/services

### 2. Onboarding

**Purpose:** Manage the KYC (Know Your Customer) and verification process.

**Key Features:**
- Tracks completion of 4 main steps:
  1. **STAKEHOLDER** - Personal information of key stakeholders
  2. **BUSINESS** - Business activity and registration details
  3. **PAYMENT_METHODS** - Payment method preferences
  4. **DOCUMENTS** - Required document uploads
- Must be completed for an **Organization** (all accounts require an organization)
- Stores step completion status and data
- Manages document uploads and metadata

**Use Cases:**
- New user needs to verify their identity
- Business needs to complete KYC before accepting payments
- Track onboarding progress for compliance

### 3. Applications

**Purpose:** API credentials and configurations for payment processing.

**Key Features:**
- Each application has unique **API Key** and **API Secret**
- Can belong to either a **User** OR an **Organization** (exclusive)
- Has **environment** (DEVELOPMENT, STAGING, PRODUCTION)
- Has **status** (ACTIVE, INACTIVE, SUSPENDED)
- Tracks usage metrics (total payments, volume, last used)
- Stores configuration (webhook URLs, default currency, etc.)

**Use Cases:**
- Developer needs API credentials to integrate payments
- Business wants separate apps for different products
- Track API usage and performance

---

## Entity Relationships

### Database Schema

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ (1:many)
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│Organization │   │ Application  │
└──────┬──────┘   └──────┬───────┘
       │                 │
       │ (1:many)        │ (1:many)
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│OnboardingStep│   │   Payment   │
└─────────────┘   └─────────────┘
       │
       │ (1:many)
       │
       ▼
┌─────────────┐
│  Document   │
└─────────────┘
```

### Detailed Relationships

#### User ↔ Organization
- **Relationship:** One-to-One (User owns exactly ONE Organization)
- **Direction:** User → Organization (via `owner` field)
- **Constraint:** Each user can only have one organization. Attempting to create a second organization will return a 409 Conflict error.
- **Additional:** Organization can have many members (Many-to-Many)

#### User ↔ Application
- **Relationship:** One-to-Many (User owns many Applications)
- **Direction:** User → Application (via `owner_user_id` field)
- **Note:** Application can belong to User OR Organization, but not both

#### Organization ↔ Application
- **Relationship:** One-to-Many (Organization owns many Applications)
- **Direction:** Organization → Application (via `owner_organization_id` field)
- **Note:** Application can belong to User OR Organization, but not both

#### User ↔ OnboardingStep
- **Relationship:** One-to-Many (User has many OnboardingSteps)
- **Direction:** User → OnboardingStep (via `user_id` field)
- **Note:** OnboardingStep can also belong to Organization

#### Organization ↔ OnboardingStep
- **Relationship:** One-to-Many (Organization has many OnboardingSteps)
- **Direction:** Organization → OnboardingStep (via `organization_id` field)
- **Note:** OnboardingStep can also belong to User

#### User ↔ Document
- **Relationship:** One-to-Many (User has many Documents)
- **Direction:** User → Document (via `user_id` field)
- **Note:** Document can also belong to Organization

#### Organization ↔ Document
- **Relationship:** One-to-Many (Organization has many Documents)
- **Direction:** Organization → Document (via `organization_id` field)
- **Note:** Document can also belong to User

#### Application ↔ Payment
- **Relationship:** One-to-Many (Application processes many Payments)
- **Direction:** Application → Payment (via `application` relation)

---

## Module Interactions

### 1. Organization Creation Flow

```
1. User creates Organization
   POST /api/organizations
   → Creates Organization with user as owner
   → Organization status: PENDING

2. User starts Onboarding for Organization
   POST /api/onboarding/stakeholder?organizationId={id}
   → Creates OnboardingStep with organization_id

3. User completes Onboarding steps
   → Updates OnboardingStep.completed = true
   → Organization status may change based on completion

4. User creates Application for Organization
   POST /api/applications
   Body: { ..., organization_id: "{id}" }
   → Creates Application with owner_organization_id
```

### 2. Application Ownership Rules

**Important:** An Application can belong to EITHER a User OR an Organization, but NOT both.

**When creating an Application:**
- If `organization_id` is provided → Application belongs to Organization
- If `organization_id` is NOT provided → Application belongs to authenticated User
- Cannot provide both (will return error)

**When querying Applications:**
- Filter by `organization_id` query parameter to get organization's apps
- Omit `organization_id` to get user's personal apps
- System automatically filters by ownership

### 3. Onboarding Context

**Important:** Onboarding **requires an organization**. All onboarding steps must be completed in the context of an organization.

**Why organizations are required:**
- Payment processing is a business activity
- The BUSINESS step requires business activity details (primaryActivity, expectedVolume, etc.)
- Organizations provide a clear entity for KYC/verification
- Simplifies the verification and compliance process

**Onboarding Flow:**
1. User creates an Organization first
2. User completes onboarding for that Organization
3. OnboardingStep and Document have both `user_id` and `organization_id`
4. User must own the organization

**Endpoints:**
```
POST /api/onboarding/stakeholder?organizationId={id}  ← organizationId is REQUIRED
POST /api/onboarding/business?organizationId={id}
POST /api/onboarding/payment-methods?organizationId={id}
POST /api/onboarding/documents?organizationId={id}
```

**Error Response:**
If `organizationId` is missing:
```json
{
  "status_code": 400,
  "status": "BAD REQUEST",
  "message": "Organization is required for onboarding. Please create an organization first.",
  "data": null
}
```

---

## Common Workflows

### Workflow 1: Personal/Solo Business Account Setup

**Note:** Even for personal/solo businesses, an organization must be created first.

```
1. User signs up
   POST /api/auth/sign-up

2. User creates Organization (required for onboarding)
   POST /api/organizations
   → Returns organization with id

3. User completes onboarding for Organization
   POST /api/onboarding/stakeholder?organizationId={orgId}
   POST /api/onboarding/business?organizationId={orgId}
   POST /api/onboarding/payment-methods?organizationId={orgId}
   POST /api/onboarding/documents?organizationId={orgId}

4. User checks organization onboarding progress
   GET /api/onboarding/organizations/{orgId}/progress

5. User creates Application for Organization
   POST /api/applications
   Body: { name: "...", organization_id: "{orgId}" }

6. User uses Organization's Application API key for payments
   POST /api/make-payment
   Headers: { Authorization: Bearer {token}, x-api-key: {api_key} }
```

### Workflow 2: Business Account Setup

```
1. User creates Organization
   POST /api/organizations
   → Returns organization with id

2. User starts organization onboarding
   POST /api/onboarding/stakeholder?organizationId={orgId}
   POST /api/onboarding/business?organizationId={orgId}
   POST /api/onboarding/payment-methods?organizationId={orgId}
   POST /api/onboarding/documents?organizationId={orgId}

3. User checks organization onboarding progress
   GET /api/onboarding/organizations/{orgId}/progress

4. User creates Application for Organization
   POST /api/applications
   Body: { name: "...", organization_id: "{orgId}" }

5. User uses Organization's Application API key for payments
   POST /api/make-payment
   Headers: { Authorization: Bearer {token}, x-api-key: {org_api_key} }
```

### Workflow 3: Multi-Application Setup

```
1. User has Organization (already created)

2. User creates multiple Applications for different purposes
   POST /api/applications
   Body: { name: "Web App", organization_id: "{orgId}", environment: "PRODUCTION" }
   
   POST /api/applications
   Body: { name: "Mobile App", organization_id: "{orgId}", environment: "PRODUCTION" }
   
   POST /api/applications
   Body: { name: "Test App", organization_id: "{orgId}", environment: "DEVELOPMENT" }

3. User lists all organization applications
   GET /api/applications?organization_id={orgId}

4. Each application has separate API credentials
   → Use different x-api-key for different apps
   → Track usage separately
```

### Workflow 4: Onboarding Progress Tracking

```
1. User starts onboarding
   POST /api/onboarding/stakeholder?organizationId={orgId}

2. Frontend tracks progress
   GET /api/onboarding/organizations/{orgId}/progress
   Response: {
     progress: 25,  // Percentage
     steps: [
       { step_name: "STAKEHOLDER", completed: true },
       { step_name: "BUSINESS", completed: false },
       { step_name: "PAYMENT_METHODS", completed: false },
       { step_name: "DOCUMENTS", completed: false }
     ]
   }

3. User completes next step
   POST /api/onboarding/business?organizationId={orgId}

4. Frontend checks progress again
   GET /api/onboarding/organizations/{orgId}/progress
   → progress: 50

5. Continue until all steps completed
   → progress: 100
```

---

## API Endpoints Reference

### Organizations

**Base Path:** `/api/organizations`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create organization | Bearer + x-api-key |
| GET | `/` | List user's organizations | Bearer + x-api-key |
| GET | `/:id` | Get organization by ID | Bearer + x-api-key |
| PUT | `/:id` | Update organization | Bearer + x-api-key |
| DELETE | `/:id` | Delete organization | Bearer + x-api-key |

**Key Fields:**
- `owner`: User who created the organization
- `members`: Array of User IDs (many-to-many)
- `status`: PENDING | ACTIVE | INACTIVE | SUSPENDED

### Onboarding

**Base Path:** `/api/onboarding`

| Method | Endpoint | Description | Auth | Required Params |
|--------|----------|-------------|------|-----------------|
| POST | `/stakeholder` | Submit stakeholder info | Bearer | `organizationId` (query) |
| POST | `/business` | Submit business activity | Bearer | `organizationId` (query) |
| POST | `/payment-methods` | Configure payment methods | Bearer | `organizationId` (query) |
| POST | `/documents` | Upload document | Bearer | `organizationId` (query) |
| GET | `/organizations/:id/progress` | Get org onboarding progress | Bearer | `id` (path param) |
| GET | `/organizations/:id/documents` | Get org documents | Bearer | `id` (path param) |
| DELETE | `/documents/:id` | Delete document | Bearer | `id` (path param) |

**Query Parameters:**
- `organizationId` (REQUIRED): Organization ID for all onboarding operations. Must be provided in query string for all POST endpoints.

**Important Notes:**
- All onboarding operations require an organization
- User must own the organization
- If `organizationId` is missing, API returns 400 error with message: "Organization is required for onboarding. Please create an organization first."

**Onboarding Steps:**
1. `STAKEHOLDER` - Personal/stakeholder information
2. `BUSINESS` - Business activity details (requires business context)
3. `PAYMENT_METHODS` - Payment method preferences
4. `DOCUMENTS` - Document uploads

**All steps are completed in the context of an organization.**

### Applications

**Base Path:** `/api/applications`

| Method | Endpoint | Description | Auth | Context |
|--------|----------|-------------|------|---------|
| POST | `/` | Create application | Bearer | User or Org |
| GET | `/` | List applications | Bearer | User or Org |
| GET | `/:id` | Get application by ID | Bearer | User or Org |
| PUT | `/:id` | Update application | Bearer | User or Org |
| PUT | `/:id/regenerate-credentials` | Regenerate API keys | Bearer | User or Org |
| DELETE | `/:id` | Delete application | Bearer | User or Org |

**Query Parameters:**
- `organization_id` (optional): Filter by organization or indicate organization context

**Key Fields:**
- `owner_user_id`: If application belongs to user
- `owner_organization_id`: If application belongs to organization
- `api_key`: Public API key (returned in responses)
- `api_secret`: Secret key (only returned on creation/regeneration)
- `environment`: DEVELOPMENT | STAGING | PRODUCTION
- `status`: ACTIVE | INACTIVE | SUSPENDED

---

## Important Considerations

### 1. Application Ownership

**Critical Rule:** An Application can belong to EITHER a User OR an Organization, but NOT both.

**Implementation:**
```typescript
// User's personal application
POST /api/applications
Body: { name: "My App" }
// → owner_user_id = current_user_id
// → owner_organization_id = null

// Organization's application
POST /api/applications
Body: { name: "Business App", organization_id: "org-123" }
// → owner_user_id = null
// → owner_organization_id = "org-123"
```

**When querying:**
```typescript
// Get user's personal apps
GET /api/applications
// → Returns apps where owner_user_id = current_user_id

// Get organization's apps
GET /api/applications?organization_id=org-123
// → Returns apps where owner_organization_id = org-123
```

### 2. Onboarding Requirements

**All onboarding requires an organization:**

```typescript
// Organization onboarding (organizationId is REQUIRED)
POST /api/onboarding/stakeholder?organizationId=org-123
// → Creates OnboardingStep with user_id AND organization_id
// → Returns 400 error if organizationId is missing
```

**Important:**
- `organizationId` query parameter is **REQUIRED** for all onboarding endpoints
- User must own the organization
- Organization must be created before starting onboarding
- Progress is tracked per organization
- Documents are associated with the organization

### 3. API Key Usage

**Applications provide API credentials for payment processing:**

```typescript
// Create application
POST /api/applications
Response: {
  api_key: "pk_live_abc123...",
  api_secret: "sk_live_xyz789..."  // Only shown once!
}

// Use in payment requests
POST /api/make-payment
Headers: {
  Authorization: Bearer {user_token},
  x-api-key: {api_key}
}
```

**Security Notes:**
- `api_secret` is only returned on creation/regeneration
- Store `api_secret` securely (frontend should not persist it)
- `api_key` is safe to expose (used in headers)
- Regenerating credentials invalidates old keys

### 4. Organization Status

**Organization status affects operations:**

- `PENDING`: Newly created, onboarding may be in progress
- `ACTIVE`: Fully verified, can process payments
- `INACTIVE`: Temporarily disabled
- `SUSPENDED`: Suspended due to compliance issues

**Frontend should:**
- Check organization status before allowing payment operations
- Show appropriate UI based on status
- Guide users through onboarding if status is PENDING

### 5. Onboarding Progress

**Progress calculation:**
- 4 steps total (STAKEHOLDER, BUSINESS, PAYMENT_METHODS, DOCUMENTS)
- Each step is either completed (true) or not (false)
- Progress percentage = (completed steps / 4) * 100

**Frontend should:**
- Show progress indicator
- Enable/disable next steps based on completion
- Allow users to revisit completed steps
- Track both user and organization progress separately

### 6. Document Management

**Documents can belong to:**
- User (personal verification)
- Organization (business verification)

**Document types:**
- `ID_CARD` - National ID card
- `PASSPORT` - Passport
- `BUSINESS_REGISTRATION` - Business registration certificate
- `VAT_CERTIFICATE` - VAT registration
- `BANK_STATEMENT` - Bank statement
- `OTHER` - Other documents

**Upload:**
```typescript
POST /api/onboarding/documents?organizationId=org-123
Content-Type: multipart/form-data
Body: {
  file: File,
  documentType: "BUSINESS_REGISTRATION",
  documentNumber: "RC/DLA/2024/A/12345",
  issuingAuthority: "Ministry of Commerce",
  expiryDate: "2025-12-31"
}
```

### 7. Error Handling

**Common error scenarios:**

1. **Organization ownership:**
   ```json
   {
     "status_code": 403,
     "message": "You don't have permission to access this organization"
   }
   ```

2. **Application ownership:**
   ```json
   {
     "status_code": 404,
     "message": "Application not found"
   }
   ```
   → Check if `organization_id` query param is needed

3. **Invalid organization context:**
   ```json
   {
     "status_code": 400,
     "message": "Organization not found or you don't own it"
   }
   ```

4. **Duplicate application:**
   ```json
   {
     "status_code": 409,
     "message": "Application with this name already exists"
   }
   ```

---

## Data Flow Diagrams

### Creating Organization with Onboarding and Application

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. POST /api/organizations
     ▼
┌──────────────┐
│ Organization │ (status: PENDING)
│ id: org-123  │
└──────┬───────┘
       │
       │ 2. POST /api/onboarding/stakeholder?organizationId=org-123
       ▼
┌──────────────────┐
│ OnboardingStep   │
│ step: STAKEHOLDER│
│ org_id: org-123  │
└──────┬───────────┘
       │
       │ 3. POST /api/onboarding/business?organizationId=org-123
       ▼
┌──────────────────┐
│ OnboardingStep   │
│ step: BUSINESS   │
│ org_id: org-123  │
└──────┬───────────┘
       │
       │ 4. POST /api/onboarding/documents?organizationId=org-123
       ▼
┌──────────┐
│ Document │
│ org_id:  │
│ org-123  │
└──────┬───┘
       │
       │ 5. POST /api/applications { organization_id: "org-123" }
       ▼
┌─────────────┐
│ Application │
│ owner_org:  │
│ org-123     │
│ api_key:    │
│ pk_xxx...   │
└─────────────┘
```

### Application Ownership Decision Tree

```
                    Create Application
                           │
                           ▼
              ┌────────────────────────┐
              │ organization_id in body?│
              └────────┬────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        YES                           NO
        │                             │
        ▼                             ▼
┌───────────────┐            ┌───────────────┐
│ Verify user   │            │ Application   │
│ owns org      │            │ belongs to    │
└───────┬───────┘            │ User          │
        │                    └───────────────┘
        │
        ▼
┌───────────────┐
│ Application   │
│ belongs to    │
│ Organization  │
└───────────────┘
```

### Onboarding Flow

```
                    Onboarding Request
                           │
                           ▼
              ┌────────────────────────┐
              │ organizationId param?  │
              └────────┬────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        YES                           NO
        │                             │
        ▼                             ▼
┌───────────────┐            ┌───────────────┐
│ Verify user   │            │ Return 400     │
│ owns org      │            │ Error:         │
└───────┬───────┘            │ "Organization │
        │                     │ required"     │
        ▼                     └───────────────┘
┌───────────────┐
│ Organization  │
│ Onboarding    │
│ (Auto-init    │
│  if needed)   │
└───────────────┘
```

---

## Frontend Implementation Guidelines

### 1. State Management

**Recommended structure:**
```typescript
interface AppState {
  user: {
    id: string;
    organizations: Organization[];
    applications: Application[];
  };
  currentOrganization: Organization | null;
  onboarding: {
    orgProgress: Record<string, OnboardingProgress>; // Keyed by organization ID
  };
}
```

### 2. Context Switching

**When user selects organization:**
```typescript
// Set current organization context
setCurrentOrganization(org);

// All subsequent API calls include organizationId
onboardingService.submitStakeholder(data, org.id);
applicationsService.list(org.id);
```

### 3. Progress Tracking

**Track organization onboarding progress:**
```typescript
// Organization progress (organizationId is required)
const orgProgress = await onboardingService.getOrgProgress(orgId);

// Show progress indicator
displayProgress(orgProgress);
```

**Note:** All onboarding is organization-based, so always track progress per organization.

### 4. Application Management

**Applications can belong to users or organizations:**
```typescript
// User's personal apps (no organization_id)
const userApps = await applicationsService.list();

// Organization's apps (with organization_id)
const orgApps = await applicationsService.list(orgId);

// Display in separate sections
<PersonalApplications apps={userApps} />
<OrganizationApplications apps={orgApps} org={org} />
```

**Note:** While applications can be user-owned, onboarding always requires an organization.

### 5. API Key Security

**Handle API secrets securely:**
```typescript
// On creation, show secret once
const { api_key, api_secret } = await createApplication(data);

// Show secret in modal with copy button
showSecretModal(api_secret);

// Don't store secret in localStorage/sessionStorage
// User must copy it immediately
```

### 6. Error Handling

**Handle ownership errors:**
```typescript
try {
  await applicationsService.create({ organization_id: orgId });
} catch (error) {
  if (error.status_code === 403) {
    // User doesn't own organization
    showError("You don't have permission to create apps for this organization");
  }
}
```

---

## Summary

### Key Takeaways

1. **Organizations** represent business entities owned by users
2. **Onboarding** tracks KYC/verification for both users and organizations
3. **Applications** provide API credentials and can belong to users OR organizations
4. **Context matters:** Many endpoints accept `organizationId` to switch context
5. **Ownership is enforced:** Users can only manage their own organizations/applications
6. **Progress is tracked separately:** User and organization onboarding are independent

### Quick Reference

| Entity | Can Own Applications? | Has Onboarding? | Has Documents? |
|--------|----------------------|-----------------|---------------|
| User | ✅ Yes | ✅ Yes | ✅ Yes |
| Organization | ✅ Yes | ✅ Yes | ✅ Yes |
| Application | ❌ No | ❌ No | ❌ No |

### Support

For questions or clarifications, contact the backend development team.

---

## Admin Verification & Approval System

The onboarding system includes comprehensive admin markers to track verification and approval status across documents, onboarding steps, and organizations.

### Document Verification Markers

**Fields Added to Document Entity:**
- `verification_status`: `PENDING` | `APPROVED` | `REJECTED` (default: `PENDING`)
- `verified_by`: Admin user ID who verified the document
- `verified_at`: Timestamp when document was verified
- `rejection_reason`: Reason provided when document is rejected
- `admin_notes`: Additional admin comments/notes

**Workflow:**
1. User uploads document → `verification_status: PENDING`
2. Admin reviews → Sets status to `APPROVED` or `REJECTED`
3. System tracks who verified and when

### Onboarding Step Approval Markers

**Fields Added to OnboardingStep Entity:**
- `admin_approved`: `boolean` (default: `false`)
- `approved_by`: Admin user ID who approved the step
- `approved_at`: Timestamp when step was approved
- `admin_notes`: Admin comments/notes
- `admin_rejection_reason`: Reason if step was rejected

**Important:** A step can be `completed: true` but still `admin_approved: false`, meaning it needs admin review.

### Organization Status Management Markers

**Fields Added to Organization Entity:**
- `admin_reviewed`: `boolean` (default: `false`)
- `reviewed_by`: Admin user ID who reviewed
- `reviewed_at`: Timestamp when organization was reviewed
- `status_changed_at`: Timestamp when status was last changed
- `status_changed_by`: Admin user ID who changed status
- `admin_notes`: Admin comments/notes
- `status_change_reason`: Reason for status change

**Status Flow:**
- `PENDING` → Awaiting admin review
- `ACTIVE` → Approved and active (requires admin approval)
- `SUSPENDED` → Suspended by admin

### Frontend Implementation Guidelines

**1. Document Status Display:**
```typescript
// Show verification status badges
if (doc.verification_status === 'PENDING') {
  showPendingBadge();
} else if (doc.verification_status === 'APPROVED') {
  showApprovedBadge();
} else {
  showRejectedBadge(doc.rejection_reason);
}
```

**2. Onboarding Step Status:**
```typescript
// Check both completion and approval
const stepStatus = step.completed 
  ? (step.admin_approved ? 'APPROVED' : 'PENDING_APPROVAL')
  : 'INCOMPLETE';
```

**3. Organization Review Status:**
```typescript
// Show review information
if (!org.admin_reviewed) {
  showPendingReviewBanner();
} else {
  showReviewInfo({
    reviewedBy: org.reviewed_by,
    reviewedAt: org.reviewed_at,
    statusChangeReason: org.status_change_reason
  });
}
```

**4. Admin Dashboard Requirements:**
- Queue of pending documents (`verification_status: PENDING`)
  - Endpoint: `GET /api/onboarding/admin/documents/pending`
- Queue of pending onboarding steps (`completed: true, admin_approved: false`)
  - Endpoint: `GET /api/onboarding/admin/steps/pending`
- Queue of pending organizations (`status: PENDING` or `admin_reviewed: false`)
  - Endpoint: `GET /api/organizations/admin/pending`
- Review history with timestamps and reasons

**5. Status Dependencies:**
Organization activation typically requires:
- All onboarding steps completed AND approved
- All documents verified and approved
- Admin review completed

---

## Admin API Endpoints

**Base Path:** Resource-specific (see below)

**Authentication:** Bearer Token + Admin Role Required (`@Roles('admin')`)

### Document Verification Endpoints

**Base Path:** `/api/onboarding/admin`

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/documents/:id/verify` | Verify document (approve or reject) |
| GET | `/documents/pending` | Get all pending documents for review |

**Verify Document Request Body:**
```json
{
  "status": "APPROVED" | "REJECTED",
  "rejection_reason": "string (optional, recommended if REJECTED)",
  "admin_notes": "string (optional)"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Document verification updated successfully",
  "data": {
    "id": "string",
    "verification_status": "APPROVED" | "REJECTED",
    "verified_by": "admin_user_id",
    "verified_at": "2025-12-09T10:00:00.000Z",
    "rejection_reason": "string (if rejected)",
    "admin_notes": "string"
  }
}
```

### Onboarding Step Approval Endpoints

**Base Path:** `/api/onboarding/admin`

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/steps/:id/approve` | Approve or reject onboarding step |
| GET | `/steps/pending` | Get all pending onboarding steps for review |

**Approve Step Request Body:**
```json
{
  "approved": true | false,
  "rejection_reason": "string (optional, recommended if false)",
  "admin_notes": "string (optional)"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Onboarding step approval updated successfully",
  "data": {
    "id": "string",
    "admin_approved": true | false,
    "approved_by": "admin_user_id",
    "approved_at": "2025-12-09T10:00:00.000Z",
    "admin_rejection_reason": "string (if rejected)",
    "admin_notes": "string"
  }
}
```

### Organization Status Management Endpoints

**Base Path:** `/api/organizations/admin`

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/:id/status` | Change organization status |
| GET | `/pending` | Get all pending organizations for review |

**Change Status Request Body:**
```json
{
  "status": "PENDING" | "ACTIVE" | "SUSPENDED",
  "reason": "string (optional)",
  "admin_notes": "string (optional)"
}
```

**Response:**
```json
{
  "status_code": 200,
  "status": "OK",
  "message": "Organization status updated successfully",
  "data": {
    "id": "string",
    "status": "ACTIVE",
    "admin_reviewed": true,
    "reviewed_by": "admin_user_id",
    "reviewed_at": "2025-12-09T10:00:00.000Z",
    "status_changed_at": "2025-12-09T10:00:00.000Z",
    "status_changed_by": "admin_user_id",
    "status_change_reason": "string",
    "admin_notes": "string"
  }
}
```

### Example Admin Workflow

```
1. Admin gets pending items
   GET /api/onboarding/admin/documents/pending
   GET /api/onboarding/admin/steps/pending
   GET /api/organizations/admin/pending

2. Admin reviews document
   PUT /api/onboarding/admin/documents/{id}/verify
   Body: { "status": "APPROVED", "admin_notes": "Document verified" }

3. Admin approves onboarding step
   PUT /api/onboarding/admin/steps/{id}/approve
   Body: { "approved": true, "admin_notes": "Step approved" }

4. Admin activates organization
   PUT /api/organizations/admin/{id}/status
   Body: { "status": "ACTIVE", "reason": "All requirements met" }
```

**Last Updated:** December 2025

