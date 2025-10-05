# 🎬 How to Get Animated Videos and GIFs from Terra25 Frontend

## 🌐 **Primary Location: Animation Page**

### **Access URL:**
```
http://localhost:3000/animation
```
or 
```
http://localhost:3003/animation
```

## 🔧 **Step-by-Step Process**

### **1. Create Animation**
1. **Navigate to**: `/animation` page
2. **Configure parameters**:
   - **Layer**: Choose Terra satellite instrument (True Color, False Color, etc.)
   - **Date Range**: Select start and end dates (max 30 days)
   - **Region**: Global or custom bounding box
   - **Quality**: Resolution and output settings

3. **Click "Generate Animation"** button
4. **Wait for frames** to be generated and loaded

### **2. Export Video/GIF (API Method)**

Once animation is ready, use these API endpoints:

#### **Export Video (MP4/GIF)**
```javascript
// Step 1: Start video export
const exportResponse = await fetch(`/api/animation/export-video/${jobId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    format: 'mp4',    // or 'gif', 'webm'
    fps: 2,           // frames per second
    quality: 'medium', // low, medium, high
    width: 800        // output width
  })
});

const { exportId } = await exportResponse.json();

// Step 2: Poll export status
const statusResponse = await fetch(`/api/animation/export-status/${exportId}`);
const status = await statusResponse.json();

// Step 3: Download when ready
if (status.status === 'completed') {
  window.open(`/api/animation/download-video/${exportId}`);
}
```

#### **Download Frames (ZIP Archive)**
```javascript
// Download all frames as ZIP
window.open(`/api/animation/download-frames/${jobId}`);
```

## 🔗 **Available API Endpoints**

### **Animation Management**
```bash
# Create animation job
POST /api/animation/generate
{
  "layer": "MODIS_Terra_CorrectedReflectance_TrueColor",
  "startDate": "2024-10-01", 
  "endDate": "2024-10-05",
  "bbox": [-180, -85, 180, 85]
}

# Check animation status
GET /api/animation/{jobId}
```

### **Video Export**
```bash
# Start video export
POST /api/animation/export-video/{jobId}
{
  "format": "mp4|gif|webm",
  "fps": 2,
  "quality": "low|medium|high",
  "width": 800
}

# Check export status  
GET /api/animation/export-status/{exportId}

# Download completed video
GET /api/animation/download-video/{exportId}
```

### **Frame Downloads**
```bash
# Download frames as ZIP
GET /api/animation/download-frames/{jobId}
```

## 📁 **File Storage Locations**

### **Server-side Storage**
```
data/
├── animation_frames/        # Generated frame images
│   └── {jobId}/
│       ├── frame_001.png
│       ├── frame_002.png
│       └── ...
└── animation_videos/        # Exported video files
    ├── animation_{jobId}_{timestamp}.mp4
    ├── animation_{jobId}_{timestamp}.gif
    └── ...
```

### **Frontend Access**
- **Frames**: Loaded directly into browser via URLs
- **Videos**: Downloaded via browser download links
- **Archives**: ZIP files with all frames

## 🎯 **Current Frontend Implementation**

The animation page currently:
- ✅ **Generates animations** from satellite data
- ✅ **Displays frame-by-frame playback** with controls
- ✅ **Shows progress** and loading states
- ❌ **Missing UI buttons** for video export (needs to be added)

## 🔧 **Add Video Export to Frontend**

To add video export buttons to the animation page, insert this code:

```tsx
// Add to animation page after playback controls
{animation.frames.length > 0 && (
  <div className="mt-4 space-y-2">
    <h3 className="text-sm font-medium text-gray-300">Export Options</h3>
    <div className="flex gap-2">
      <button
        onClick={() => exportVideo(jobId, 'mp4')}
        className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm"
      >
        Export MP4
      </button>
      <button
        onClick={() => exportVideo(jobId, 'gif')}
        className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm"
      >
        Export GIF
      </button>
      <button
        onClick={() => downloadFrames(jobId)}
        className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm"
      >
        Download Frames
      </button>
    </div>
  </div>
)}

// Add these functions:
const exportVideo = async (jobId: string, format: 'mp4' | 'gif') => {
  try {
    const response = await fetch(`/api/animation/export-video/${jobId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format, fps: 2, quality: 'medium' })
    });
    
    const { exportId } = await response.json();
    
    // Poll for completion and download
    pollExportStatus(exportId);
  } catch (error) {
    console.error('Export failed:', error);
  }
};

const downloadFrames = (jobId: string) => {
  window.open(`/api/animation/download-frames/${jobId}`);
};
```

## 🎉 **Complete Workflow**

1. **Create Animation**: Use animation page to generate frames
2. **Preview**: Watch animation with speed controls  
3. **Export Video**: Use API endpoints or add UI buttons
4. **Download**: Get MP4, GIF, or ZIP files
5. **Share**: Use downloaded files for presentations, social media, etc.

The Terra25 animation system provides professional-quality satellite time-lapse videos perfect for research, education, and public outreach! 🚀