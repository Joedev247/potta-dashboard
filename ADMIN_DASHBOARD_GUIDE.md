# Admin Dashboard - Improved System

## Overview

The admin dashboard has been completely redesigned with a modern, professional UI/UX that matches the application's design pattern. It provides comprehensive management tools for administrators to control users, organizations, and onboarding processes without requiring backend database access.

## Key Features

### 1. **User Management**
- **Register new users**: Create user accounts with customizable roles (user, admin, service)
- **Search users**: Find users by username, email, or ID
- **Manage status**: Enable/disable users directly from the dashboard
- **View details**: Access comprehensive user information

### 2. **Organization Management**
- **Pending approvals**: Review organizations waiting for activation
- **Change organization status**: Approve, suspend, or reject organizations
- **Add rejection reasons**: Provide feedback when rejecting organizations
- **View onboarding progress**: See each organization's onboarding completion status

### 3. **Onboarding Document Verification**
- **Pending documents**: Review all documents awaiting verification
- **Approve/Reject**: Process documents with optional rejection reasons
- **Organized view**: See which user or organization submitted each document
- **Track submissions**: View document upload dates and file information

### 4. **Onboarding Steps Approval**
- **Pending steps**: Review onboarding steps requiring approval
- **Decision making**: Approve or reject steps with detailed feedback
- **Step tracking**: See which user or organization submitted each step
- **Submission history**: Track when steps were submitted

## Architecture

### API Service Layer (`lib/api/admin.ts`)

The admin service provides a complete set of methods:

```typescript
// User Management
adminService.registerUser(data)              // Register new user
adminService.findUsers(params)                // Search for users
adminService.changeUserStatus(data)           // Enable/disable users
adminService.createProvider(data)             // Create payment providers
adminService.activateProvider(data)           // Activate/deactivate providers

// Organization Management
adminService.getPendingOrganizations()        // Fetch pending orgs
adminService.changeOrganizationStatus(id, data) // Change org status

// Onboarding Documents
adminService.getPendingOnboardingDocuments()  // Fetch pending docs
adminService.verifyOnboardingDocument(id, data) // Approve/reject documents

// Onboarding Steps
adminService.getPendingOnboardingSteps()      // Fetch pending steps
adminService.approveOnboardingStep(id, data)  // Approve/reject steps

// System Monitoring
adminService.getLogs(params)                  // View system logs
adminService.getLogById(id)                   // Get specific log
adminService.getQueues(params)                // Monitor system queues
```

### Components

#### `AdminModal.tsx`
Reusable modal component for all admin dialogs
- Configurable size (sm, md, lg)
- Title and description support
- Clean close functionality

#### `AdminTabs.tsx`
Tab navigation component with badge support
- Icon support
- Active state styling
- Badge for pending item counts

#### `AdminTable.tsx`
Flexible data table component
- Custom column rendering
- Loading states
- Empty state messaging
- Keyboard accessible

#### `StatusBadge.tsx`
Status indicator component
- Auto-detection of badge color based on status
- Consistent styling across the app
- Support for multiple status types

## Features & Improvements

### ✅ No Backend Database Access
- All user activation happens through the admin dashboard
- Backend developers cannot directly modify user status in the database
- Audit trail through system logs

### ✅ Modern UI/UX
- Clean, professional design matching app patterns
- Responsive layout (mobile, tablet, desktop)
- Smooth transitions and interactions
- Accessible form controls

### ✅ Comprehensive Admin Features
- Multi-tab interface for different management areas
- Real-time search and filtering
- Modal-based operations (reduce navigation)
- Success/error messaging
- Loading states

### ✅ Organized Workflow
- Pending items clearly highlighted
- Batch review of documents and steps
- Detailed reasoning for rejections
- Clear status indicators

## User Workflows

### Adding a New User

1. Click "Register" button in Users tab
2. Fill in user details:
   - Username (required)
   - Email (required)
   - Password (required)
   - Role (user/admin/service)
   - First & Last Name (optional)
3. Click "Register User"
4. User is immediately activated in the system

### Approving an Organization

1. Navigate to "Organizations" tab
2. Review pending organizations
3. Click "Change Status" on the organization
4. Select approval status:
   - Active: Approve the organization
   - Suspended: Temporarily disable
   - Rejected: Decline with reason
5. If rejecting, provide rejection reason
6. Click "Update Status"

### Verifying Documents

1. Go to "Documents" tab
2. Review pending documents
3. Click "Review" on a document
4. Choose to:
   - Approve: Document is verified
   - Reject: Provide rejection reason
5. Click "Verify Document"

### Approving Onboarding Steps

1. Navigate to "Onboarding Steps" tab
2. Review pending steps
3. Click "Review" on a step
4. Choose to:
   - Approve: Step is completed
   - Reject: Provide feedback
5. Click "Approve Step"

## API Endpoints Used

All admin operations use these endpoints:

```
POST   /api/admin/register                    - Register user
GET    /api/admin/find                        - Find users
PUT    /api/admin/change-status               - Change user status
POST   /api/admin/created-provider            - Create provider
PUT    /api/admin/activated-provider          - Activate/deactivate provider

GET    /api/organizations/admin/pending       - Get pending orgs
PUT    /api/organizations/admin/:id/status    - Change org status

GET    /api/onboarding/admin/documents/pending
PUT    /api/onboarding/admin/documents/:id/verify

GET    /api/onboarding/admin/steps/pending
PUT    /api/onboarding/admin/steps/:id/approve

GET    /api/admin/logs                        - View system logs
GET    /api/admin/queues                      - Monitor queues
```

## Security Notes

- All admin endpoints require `admin` role authentication
- Authentication is done via `token` header (not `Authorization`)
- Token is obtained from login and stored in localStorage as `accessToken`
- Each action logs who performed it and when
- Rejection reasons are recorded for audit trails

## Styling & Design

The admin dashboard uses:
- **Colors**: Green/teal theme matching the app
- **Icons**: Phosphor icons for consistency
- **Spacing**: Tailwind CSS for responsive design
- **Components**: Reusable, composable components
- **Accessibility**: Semantic HTML and ARIA labels

## Future Enhancements

- [ ] Bulk actions (approve/reject multiple items)
- [ ] Export functionality (CSV, PDF)
- [ ] Advanced filtering and sorting
- [ ] User activity logs
- [ ] Admin activity audit trail
- [ ] Custom rejection templates
- [ ] Scheduled approvals
- [ ] API key management dashboard

## Troubleshooting

### "Admin access required" error
- Verify user has `admin` role
- Check token is valid and not expired
- Ensure token is in localStorage as `accessToken`

### No data showing in tabs
- Confirm there are pending items
- Check network tab for failed requests
- Verify backend API endpoints are working

### Modal not opening
- Check browser console for errors
- Ensure all dependencies are installed
- Verify onClick handlers are properly bound

## Support

For issues or feature requests, contact the development team with:
- Steps to reproduce
- Browser and OS information
- Screenshots if applicable
