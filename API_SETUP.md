# API Server Setup Guide

## ⚠️ Important: Backend API Server Required

The frontend is configured to connect to a backend API server. The 404 errors you're seeing indicate that the backend API server is not running or not accessible.

## Current Configuration

The API client is configured to connect to:
- **URL**: `http://localhost:3000` (from `.env.local`)

## Setup Steps

### 1. Start Your Backend API Server

Make sure your Instavi Payment API backend server is running. The backend should be running on a port (typically different from your Next.js frontend).

**Common backend ports:**
- `http://localhost:3001`
- `http://localhost:5000`
- `http://localhost:8000`
- `http://localhost:4000`

### 2. Update API URL

If your backend is running on a different port, update `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:YOUR_BACKEND_PORT
```

For example, if your backend runs on port 3001:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Restart Next.js Dev Server

After updating `.env.local`, restart your Next.js development server:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### 4. Verify Backend is Running

You can test if your backend is accessible by opening:
- `http://localhost:YOUR_BACKEND_PORT/api/auth/login` (should return an error, but not 404)

Or use curl:
```bash
curl http://localhost:YOUR_BACKEND_PORT/api/auth/login
```

## Backend API Endpoints Expected

Your backend should implement these endpoints:

### Authentication
- `POST /api/auth/login`

### Customer Endpoints
- `PUT /api/users/customer/genarate-credentials`
- `GET /api/users/customer/transactions`
- `GET /api/users/customer/transactions/{id}`

### Admin Endpoints
- `POST /api/users/admin/register`
- `PUT /api/users/admin/change-status`
- `POST /api/users/admin/created-provider`
- `PUT /api/users/admin/activated-provider`
- `GET /api/users/admin/find`
- `GET /api/users/admin/logs`
- `GET /api/users/admin/logs/{id}`

### Payment Endpoints
- `POST /api/paiments/make-payment`
- `GET /api/paiments/payment-status/{transaction_id}`
- `GET /api/paiments/verify-account-holder-active`
- `GET /api/paiments/verify-account-holder-basic-info`

### Webhook Endpoints
- `PUT /api/paiments/webhooks/mtn-callback`
- `GET/POST/PUT/DELETE/PATCH/OPTIONS/HEAD /api/paiments/ipn/momo`

### Admin Endpoints
- `GET /api/admin/queues`

## Troubleshooting

### Error: "API endpoint not found: http://localhost:3000/api/auth/login"

**Solution:** Your backend API server is not running or is on a different port.

1. Check if your backend server is running
2. Verify the port number
3. Update `.env.local` with the correct port
4. Restart Next.js dev server

### Error: "Cannot connect to API server"

**Solution:** 
1. Check if backend server is running
2. Check for CORS issues (backend needs to allow requests from `http://localhost:3000`)
3. Verify firewall/network settings
4. Check backend server logs for errors

### CORS Errors

If you see CORS errors, your backend needs to allow requests from your frontend origin. Add CORS headers in your backend:

```javascript
// Example for Express.js
app.use(cors({
  origin: 'http://localhost:3000', // Your Next.js frontend URL
  credentials: true
}));
```

## Development vs Production

- **Development**: Use `http://localhost:YOUR_PORT` in `.env.local`
- **Production**: Update to your production API URL (e.g., `https://api.yourdomain.com`)

## Need Help?

If you don't have a backend server yet, you'll need to:
1. Set up the Instavi Payment API backend server
2. Or use a mock API server for development
3. Or implement the backend endpoints yourself

The frontend integration is complete and ready - it just needs a backend API server to connect to!


