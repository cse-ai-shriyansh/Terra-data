# Frontend API Data Loading - Complete Guide

## 📍 **Primary Locations for API Data Loading**

### 1. **Animation Page** (`apps/web/src/app/animation/page.tsx`)
**Main Features:**
- Animation generation and management
- Real-time progress tracking
- Video export capabilities

**Key API Calls:**
```typescript
// Load available layers
fetch('/api/earthdata-export/layers')

// Create animation job  
fetch('/api/earthdata-export/export', {
  method: 'POST',
  body: JSON.stringify({...config, date})
})

// Poll job status
fetch(`/api/earthdata-export/status/${jobId}`)
```

**Data Flow:**
1. Component loads → Fetch available layers
2. User creates animation → POST to export endpoint  
3. Background polling → Check job completion status
4. Display frames → Load completed image URLs

### 2. **Earthdata Export Page** (`apps/web/src/app/earthdata-export/page.tsx`)
**Main Features:**
- Single image export
- Layer configuration
- Export status tracking

**Key API Calls:**
```typescript
// Load layers (same as animation)
fetch('/api/earthdata-export/layers')

// Export single image
fetch('/api/earthdata-export/export', {
  method: 'POST',
  body: JSON.stringify(exportParams)
})

// Check export status
fetch(`/api/earthdata-export/status/${jobId}`)
```

### 3. **Terra Page** (`apps/web/src/app/terra/page.tsx`)
**Main Features:**
- API health check
- Terra tile demonstrations
- Live satellite data access

**Key API Calls:**
```typescript
// Health check
fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'}/health`)

// Uses terra-client.ts for additional functionality
```

### 4. **Terra Client Library** (`apps/web/src/lib/terra-client.ts`)
**Utility Functions:**
- Centralized API communication
- Terra tile URL generation
- Batch operations

**Key Methods:**
```typescript
class TerraClient {
  // Get single tile URL
  async getTerraTileUrl(date, z, x, y, layer, resolution)
  
  // Batch tile operations
  async getTileSequence(dates, z, x, y, layer)
  
  // Animation prefetch
  async prefetchForAnimation(startDate, endDate, layer)
}
```

## 🔍 **How to Debug API Loading Issues**

### **1. Browser Developer Tools**
```javascript
// Open Network tab to see all API requests
// Filter by "XHR/Fetch" to see only API calls
// Check request/response headers and payloads
```

### **2. Console Logging**
Look for these patterns in the code:
```typescript
console.log('Starting export job:', exportParams)
console.error('Export error:', error)
console.log(`Frame ${i + 1} completed:`, result.filename)
```

### **3. API Endpoints to Monitor**
```
GET  /api/earthdata-export/layers     # Available layers
POST /api/earthdata-export/export     # Create export job
GET  /api/earthdata-export/status/:id # Job status
GET  /health                          # API health check
```

## 🚀 **State Management Patterns**

### **Loading States:**
```typescript
const [animation, setAnimation] = useState({
  loading: false,    // Request in progress
  error: null,       // Error message
  frames: []         // Loaded data
})
```

### **Polling Patterns:**
```typescript
// Animation page uses setInterval for status polling
const pollInterval = setInterval(async () => {
  // Check job status
  const response = await fetch(`/api/earthdata-export/status/${jobId}`)
  // Update UI based on response
}, 5000) // Poll every 5 seconds
```

### **Error Handling:**
```typescript
try {
  const response = await fetch('/api/...')
  const result = await response.json()
  if (result.success) {
    // Handle success
  } else {
    // Handle API error
  }
} catch (error) {
  // Handle network error
  console.error('API call failed:', error)
}
```

## 📊 **Data Flow Architecture**

```
Frontend Component
       ↓
   API Call (fetch)
       ↓
   Backend Route (/api/...)
       ↓
   NASA GIBS API / Processing
       ↓
   Response Data
       ↓
   Frontend State Update
       ↓
   UI Re-render
```

## 🛠️ **Common API Integration Patterns**

### **1. Initial Data Loading (useEffect)**
```typescript
useEffect(() => {
  fetch('/api/layers')
    .then(res => res.json())
    .then(data => setLayers(data.layers))
    .catch(console.error)
}, [])
```

### **2. User-Triggered Actions**
```typescript
const handleExport = async () => {
  setLoading(true)
  try {
    const response = await fetch('/api/export', {
      method: 'POST',
      body: JSON.stringify(params)
    })
    const result = await response.json()
    // Handle result
  } catch (error) {
    setError(error.message)
  } finally {
    setLoading(false)
  }
}
```

### **3. Real-time Status Updates**
```typescript
const startPolling = (jobId) => {
  const interval = setInterval(async () => {
    const status = await checkJobStatus(jobId)
    if (status === 'completed') {
      clearInterval(interval)
      // Handle completion
    }
  }, 5000)
}
```

## 🔧 **Environment Configuration**

API base URL is configured via environment variable:
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'
```

Default development ports:
- **Frontend**: `http://localhost:3003`
- **API**: `http://localhost:3005`

## 📝 **Quick Debugging Checklist**

1. ✅ Check browser Network tab for failed requests
2. ✅ Verify API server is running on correct port
3. ✅ Check console for JavaScript errors
4. ✅ Confirm request payload format matches API expectations
5. ✅ Test API endpoints directly (Postman/curl)
6. ✅ Verify environment variables are set correctly
7. ✅ Check for CORS issues in browser console

This guide covers all the major places where API data loading occurs in the Terra25 frontend application!