# Admin Dashboard - Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Admin Dashboard                          │
│                      (app/admin/page.tsx)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
        ┌───────▼──────┐ ┌────▼─────┐ ┌────▼────────┐
        │   State      │ │Callbacks │ │   Effects   │
        │  Management  │ │          │ │             │
        ├──────────────┤ ├──────────┤ ├─────────────┤
        │ - users      │ │- fetch   │ │- Load data  │
        │ - orgs       │ │- register│ │  on tab     │
        │ - documents  │ │- verify  │ │  change     │
        │ - steps      │ │- approve │ │             │
        └──────────────┘ └──────────┘ └─────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
        ┌───────▼──────┐ ┌────▼─────┐ ┌────▼────────┐
        │  Components  │ │  Modals   │ │   Helpers   │
        ├──────────────┤ ├──────────┤ ├─────────────┤
        │- AdminTabs   │ │- Register│ │- format     │
        │- AdminTable  │ │- Status  │ │- toast msgs │
        │- StatusBadge │ │- Org     │ │             │
        │- AdminModal  │ │- Document│ │             │
        │              │ │- Step    │ │             │
        └──────────────┘ └──────────┘ └─────────────┘
                              │
                ┌─────────────▼──────────────┐
                │   Admin API Service        │
                │  (lib/api/admin.ts)        │
                ├────────────────────────────┤
                │ - registerUser()           │
                │ - changeUserStatus()       │
                │ - getPendingOrganizations()│
                │ - changeOrgStatus()        │
                │ - verifyDocument()         │
                │ - approveStep()            │
                │ - createProvider()         │
                │ - getLogs()                │
                └────────────┬───────────────┘
                             │
                ┌────────────▼──────────────┐
                │    API Client             │
                │  (lib/api/client.ts)      │
                └────────────┬───────────────┘
                             │
                ┌────────────▼──────────────┐
                │  Backend API Endpoints    │
                │   (REST/HTTP)             │
                └────────────────────────────┘
```

## User Flow - Register New User

```
Admin clicks "Register" button
          │
          ▼
Register Modal Opens
          │
          ▼
Admin fills form:
- Username ✓
- Email ✓
- Password ✓
- Role (optional)
- Names (optional)
          │
          ▼
Click "Register User"
          │
          ▼
Validate form data
          │
          ▼
POST /api/admin/register
          │
          ▼
Backend creates user
          │
          ▼
Success message shown
          │
          ▼
Modal closes
          │
          ▼
User added to system ✓
```

## Organization Approval Flow

```
Organizations Tab
        │
        ▼
Load pending orgs
        │
        ▼
Display org list with:
- Name
- Owner info
- Onboarding progress
- Current status (PENDING)
        │
        ▼
Click "Change Status"
        │
        ▼
Status Modal Opens
        │
        ▼
Admin selects:
- ACTIVE (approve)
- SUSPENDED (pause)
- REJECTED (decline)
        │
        ▼
If REJECTED, add reason
        │
        ▼
Click "Update Status"
        │
        ▼
PUT /api/organizations/admin/:id/status
        │
        ▼
Backend updates org
        │
        ▼
Success message
        │
        ▼
List refreshes
        │
        ▼
Org status changed ✓
```

## Document Verification Flow

```
Documents Tab
        │
        ▼
Load pending documents
        │
        ▼
Display doc list with:
- File name
- Document type
- Uploader info
- Upload date
        │
        ▼
Click "Review"
        │
        ▼
Verification Modal Opens
        │
        ▼
Admin can:
- View document details
- Select APPROVE or REJECT
        │
        ▼
If REJECT, add reason
        │
        ▼
Click "Verify Document"
        │
        ▼
PUT /api/onboarding/admin/documents/:id/verify
        │
        ▼
Backend updates document
        │
        ▼
Success message
        │
        ▼
List refreshes
        │
        ▼
Document verified ✓
```

## Onboarding Step Approval Flow

```
Onboarding Steps Tab
        │
        ▼
Load pending steps
        │
        ▼
Display steps list with:
- Step name
- Submitter info
- Submission date
- Step data
        │
        ▼
Click "Review"
        │
        ▼
Approval Modal Opens
        │
        ▼
Admin can:
- View step details
- Select APPROVE or REJECT
        │
        ▼
If REJECT, add reason
        │
        ▼
Click "Approve Step"
        │
        ▼
PUT /api/onboarding/admin/steps/:id/approve
        │
        ▼
Backend updates step
        │
        ▼
Success message
        │
        ▼
List refreshes
        │
        ▼
Step approved ✓
```

## Data Flow - Search Users

```
User enters search query
        │
        ▼
Select search type:
(username, email, id)
        │
        ▼
Click "Search"
        │
        ▼
Loading spinner shows
        │
        ▼
GET /api/admin/find?{type}={query}
        │
        ▼
Backend searches
        │
        ▼
Returns matching users
        │
        ▼
Parse response
        │
        ▼
Normalize user data
        │
        ▼
Update users state
        │
        ▼
Display in table
        │
        ▼
Admin can now:
- View details
- Enable/disable
- Change status
```

## Component Hierarchy

```
AdminPage (main page)
│
├── AdminTabs
│   ├── Users Tab
│   ├── Organizations Tab
│   ├── Documents Tab
│   └── Onboarding Steps Tab
│
├── AdminTable (for Users tab)
│   ├── StatusBadge (status column)
│   └── Action buttons
│
├── Modals (displayed conditionally)
│   ├── AdminModal (Register User)
│   ├── AdminModal (Change User Status)
│   ├── AdminModal (Change Org Status)
│   ├── AdminModal (Verify Document)
│   └── AdminModal (Approve Step)
│
└── Utilities
    ├── formatDate (format timestamps)
    ├── Success/Error messages
    └── Loading states
```

## State Management Pattern

```
┌─────────────────────────────────────┐
│   Component State (useState)         │
├─────────────────────────────────────┤
│ - activeTab                         │
│ - loading                           │
│ - actionLoading                     │
│ - successMessage / errorMessage     │
└────────────┬────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
Data States      Modal States
────────────     ────────────
- users          - registerModalOpen
- organizations  - statusModalOpen
- documents      - orgStatusModalOpen
- steps          - docModalOpen
                 - stepModalOpen

    │                 │
    └────────┬────────┘
             │
    ┌────────▼────────────┐
    │  Form Data States   │
    ├─────────────────────┤
    │ - registerData      │
    │ - orgStatus         │
    │ - docAction         │
    │ - stepAction        │
    └─────────────────────┘
```

## API Call Pattern

```
┌──────────────────────────────────────┐
│  User Action (click button)           │
└──────────────────┬───────────────────┘
                   │
        ┌──────────▼──────────┐
        │ Validate Input      │
        │ (if form)           │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │ Set Loading State   │
        │ Clear Messages      │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────────────┐
        │ Call adminService method    │
        │ (e.g., registerUser)        │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────────────┐
        │ Receive Response            │
        │ - Check success flag        │
        │ - Extract data              │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────────────┐
        │ Update State                │
        │ - Show message              │
        │ - Close modal               │
        │ - Refresh data              │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────────────┐
        │ UI Updates                  │
        │ - Remove loading spinner    │
        │ - Show success/error        │
        │ - Auto-refresh if needed    │
        └──────────────────────────────┘
```

## Tab Switching Logic

```
User clicks tab
        │
        ▼
Update activeTab state
        │
        ▼
useEffect triggered
(activeTab dependency)
        │
        ▼
Check which tab:
│
├─ users → call fetchUsers()
│          (if search query exists)
│
├─ organizations → call fetchPendingOrganizations()
│
├─ documents → call fetchPendingDocuments()
│
└─ onboarding → call fetchPendingSteps()
        │
        ▼
API request sent
        │
        ▼
Data received & state updated
        │
        ▼
Tab content re-renders with data ✓
```

## Error Handling Flow

```
API Call Made
        │
        ▼
Network Request
        │
        ├─ Success? ──► Process data ──► Update state
        │
        └─ Error? ──────────┬──────────┐
                            │          │
                    ┌───────▼──┐  ┌───▼──────────┐
                    │HTTP Error│  │Validation    │
                    │(4xx, 5xx)│  │Error         │
                    └───────┬──┘  └───┬──────────┘
                            │         │
                    ┌───────▼─────────▼──┐
                    │ Display Error Msg  │
                    │ (user sees issue)  │
                    └────────────────────┘
                            │
                    ┌───────▼──────────────┐
                    │ Clear Loading States │
                    │ Keep Modal Open      │
                    │ (allow retry)        │
                    └────────────────────┘
```

## Security & Authentication Flow

```
User logs in
        │
        ▼
Backend validates credentials
        │
        ▼
Returns access token
        │
        ▼
Token stored in localStorage
        │
        ▼
Navigate to /admin
        │
        ▼
Load admin dashboard
        │
        ▼
API Client auto-adds token
        │
        │ (Authorization: token <access_token>)
        │
        ▼
Each API request validated
        │
        ├─ Valid → Process request
        │
        └─ Invalid → Return 401 error
                     ↓
                  Redirect to login
```

---

These diagrams show how all the pieces fit together to create a complete, secure admin system!
