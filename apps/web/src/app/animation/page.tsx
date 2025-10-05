'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Download, Calendar, Settings, Image, Clock, Zap } from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { LoadingSpinner } from '@/components/loading-spinner';

interface AnimationFrame {
  id: string;
  date: string;
  url: string;
  filename: string;
  loaded: boolean;
}

interface AnimationState {
  frames: AnimationFrame[];
  currentIndex: number;
  isPlaying: boolean;
  speed: number; // frames per second
  loop: boolean;
  loading: boolean;
  error: string | null;
}

export default function AnimationPage() {
  const [config, setConfig] = useState({
    layer: 'terra_true_color',
    startDate: '2024-09-25',
    endDate: '2024-10-05',
    method: 'direct',
    width: 1920,
    height: 1080,
    zoom: 2,
    region: 'global'
  });

  const [animation, setAnimation] = useState<AnimationState>({
    frames: [],
    currentIndex: 0,
    isPlaying: false,
    speed: 2, // 2 FPS default
    loop: true,
    loading: false,
    error: null
  });

  const [availableLayers, setAvailableLayers] = useState<any>({});
  const [generationJobs, setGenerationJobs] = useState<string[]>([]);
  const [exportJobs, setExportJobs] = useState<{[key: string]: string}>({});
  const [exportStatus, setExportStatus] = useState<{[key: string]: any}>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load available layers on component mount
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
    fetch(`${apiUrl}/api/earthdata-export/layers`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAvailableLayers(data.layers);
        }
      })
      .catch(console.error);
  }, []);

  // Generate date range
  const generateDateRange = (start: string, end: string): string[] => {
    const dates: string[] = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const current = new Date(startDate);
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  // Generate animation frames
  const generateAnimation = async () => {
    setAnimation(prev => ({ ...prev, loading: true, error: null, frames: [] }));
    
    try {
      const dates = generateDateRange(config.startDate, config.endDate);
      
      if (dates.length > 30) {
        setAnimation(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Too many frames requested. Please limit to 30 days or less.' 
        }));
        return;
      }

      console.log(`Generating animation for ${dates.length} dates`);

      // Try the new animation API first, but fall back to earthdata export if it fails
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
      
      try {
        const response = await fetch(`${apiUrl}/api/animation/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            layer: config.layer,
            startDate: config.startDate,
            endDate: config.endDate,
            method: 'direct',
            width: 800,
            height: 600,
            zoom: 2,
            region: config.region,
            frameRate: animation.speed,
            format: 'frames'
          })
        });

        const result = await response.json();
        
        if (result.success) {
          const animationJobId = result.jobId;
          setGenerationJobs([animationJobId]);
          
          // Create initial frame structure
          const frames: AnimationFrame[] = dates.map(date => ({
            id: `${config.layer}_${date}`,
            date,
            url: '',
            filename: '',
            loaded: false
          }));

          setAnimation(prev => ({ ...prev, frames }));
          
          // Start polling for animation completion
          startAnimationPolling(animationJobId, frames);
          return;
        }
      } catch (error) {
        console.log('Animation API failed, falling back to earthdata export:', error);
      }

      // Fallback to earthdata export system
      console.log('Using earthdata export fallback system');
      
      // Create initial frame structure
      const frames: AnimationFrame[] = dates.map(date => ({
        id: `${config.layer}_${date}`,
        date,
        url: '',
        filename: '',
        loaded: false
      }));

      setAnimation(prev => ({ ...prev, frames }));

      // Start generating images for each date using earthdata export
      const jobs: string[] = [];
      for (const date of dates) {
        try {
          const response = await fetch(`${apiUrl}/api/earthdata-export/export`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...config,
              date
            })
          });

          const result = await response.json();
          if (result.success) {
            jobs.push(result.jobId);
            console.log(`Started export job for ${date}: ${result.jobId}`);
          }
        } catch (error) {
          console.error(`Failed to start export for ${date}:`, error);
        }
      }

      setGenerationJobs(jobs);
      
      // Start polling for completed jobs
      startJobPolling(jobs, frames);

    } catch (error) {
      console.error('Animation generation error:', error);
      setAnimation(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to generate animation. Please try again.' 
      }));
    }
  };

  // Poll for animation job completion
  const startAnimationPolling = (animationJobId: string, frames: AnimationFrame[]) => {
    const pollInterval = setInterval(async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
        const response = await fetch(`${apiUrl}/api/animation/status/${animationJobId}`);
        const result = await response.json();

        if (result.success) {
          const job = result.job;
          console.log('Animation job status:', job.status, 'Progress:', job.progress);
          console.log('Job frames:', job.frames);
          
          // Update frames with URLs if available
          if (job.frames) {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
            const updatedFrames = frames.map((frame, index) => {
              const jobFrame = job.frames[index];
              if (jobFrame && jobFrame.status === 'completed' && jobFrame.url) {
                const fullUrl = `${apiUrl}${jobFrame.url}`;
                console.log(`Frame ${index} completed with URL:`, fullUrl);
                return {
                  ...frame,
                  url: fullUrl, // Convert relative URL to full URL
                  filename: jobFrame.filename || `frame_${index}.png`,
                  loaded: true
                };
              }
              return frame;
            });
            
            setAnimation(prev => ({ ...prev, frames: updatedFrames }));
          }

          // Check if animation is completed
          if (job.status === 'completed') {
            clearInterval(pollInterval);
            setAnimation(prev => ({ ...prev, loading: false }));
            console.log('Animation generation completed!');
          } else if (job.status === 'failed') {
            clearInterval(pollInterval);
            setAnimation(prev => ({ 
              ...prev, 
              loading: false, 
              error: 'Animation generation failed. Please try again.' 
            }));
          }
        }
      } catch (error) {
        console.error(`Error checking animation job ${animationJobId}:`, error);
      }
    }, 2000);

    // Stop polling after 10 minutes
    setTimeout(() => clearInterval(pollInterval), 600000);
  };

  // Poll for job completion (legacy function - kept for compatibility)
  const startJobPolling = (jobIds: string[], frames: AnimationFrame[]) => {
    const pollInterval = setInterval(async () => {
      let completedCount = 0;
      const updatedFrames = [...frames];

      for (let i = 0; i < jobIds.length; i++) {
        const jobId = jobIds[i];
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
          const response = await fetch(`${apiUrl}/api/earthdata-export/status/${jobId}`);
          const result = await response.json();

          if (result.status === 'completed' && !updatedFrames[i].loaded) {
            updatedFrames[i] = {
              ...updatedFrames[i],
              url: result.downloadUrl,
              filename: result.filename,
              loaded: true
            };
            completedCount++;
            console.log(`Frame ${i + 1} completed: ${result.filename}`);
          } else if (result.status === 'completed') {
            completedCount++;
          }
        } catch (error) {
          console.error(`Error checking job ${jobId}:`, error);
        }
      }

      setAnimation(prev => ({ ...prev, frames: updatedFrames }));

      // If all jobs completed, stop polling
      if (completedCount === jobIds.length) {
        clearInterval(pollInterval);
        setAnimation(prev => ({ ...prev, loading: false }));
        console.log('All animation frames completed!');
      }
    }, 2000);

    // Stop polling after 10 minutes
    setTimeout(() => clearInterval(pollInterval), 600000);
  };

  // Animation playback controls
  const play = useCallback(() => {
    if (animation.frames.length === 0) return;

    setAnimation(prev => ({ ...prev, isPlaying: true }));
    
    intervalRef.current = setInterval(() => {
      setAnimation(prev => {
        const nextIndex = prev.currentIndex + 1;
        
        if (nextIndex >= prev.frames.length) {
          if (prev.loop) {
            return { ...prev, currentIndex: 0 };
          } else {
            // Stop at the end
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return { ...prev, isPlaying: false };
          }
        }
        
        return { ...prev, currentIndex: nextIndex };
      });
    }, 1000 / animation.speed);
  }, [animation.speed, animation.frames.length]);

  const pause = useCallback(() => {
    setAnimation(prev => ({ ...prev, isPlaying: false }));
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stepBackward = useCallback(() => {
    setAnimation(prev => ({
      ...prev,
      currentIndex: Math.max(0, prev.currentIndex - 1)
    }));
  }, []);

  const stepForward = useCallback(() => {
    setAnimation(prev => ({
      ...prev,
      currentIndex: Math.min(prev.frames.length - 1, prev.currentIndex + 1)
    }));
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle play/pause toggle
  const togglePlayback = () => {
    if (animation.isPlaying) {
      pause();
    } else {
      play();
    }
  };

  // Speed control
  const handleSpeedChange = (newSpeed: number) => {
    setAnimation(prev => ({ ...prev, speed: newSpeed }));
    
    // If playing, restart with new speed
    if (animation.isPlaying) {
      pause();
      setTimeout(() => play(), 100);
    }
  };

  // Calculate progress
  const progress = animation.frames.length > 0 
    ? (animation.currentIndex / (animation.frames.length - 1)) * 100 
    : 0;

  const loadedFrames = animation.frames.filter(f => f.loaded).length;
  const loadingProgress = animation.frames.length > 0 
    ? (loadedFrames / animation.frames.length) * 100 
    : 0;

  // Export animation as video
  const exportVideo = async (format: 'mp4' | 'gif' | 'webm') => {
    if (generationJobs.length === 0) {
      alert('No animation job available for export');
      return;
    }

    const jobId = generationJobs[0];
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
    
    // Check if this is an animation job ID (starts with 'anim_') or earthdata export job ID
    const isAnimationJob = jobId.startsWith('anim_');
    
    try {
      if (isAnimationJob) {
        // Use the animation video export endpoint
        const response = await fetch(`${apiUrl}/api/animation/export-video/${jobId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            format,
            fps: animation.speed,
            quality: 'medium',
            width: 800
          })
        });

        const result = await response.json();
        if (result.success) {
          const exportId = result.exportId;
          setExportJobs(prev => ({ ...prev, [format]: exportId }));
          
          // Start polling export status
          pollExportStatus(exportId, format);
          
          console.log(`Started ${format.toUpperCase()} export:`, exportId);
        } else {
          throw new Error(result.error || `Failed to start ${format.toUpperCase()} export`);
        }
      } else {
        // For earthdata export jobs, create video from frame URLs
        if (animation.frames.length === 0 || !animation.frames.some(f => f.loaded)) {
          alert('No frames available for video export. Please wait for animation to complete.');
          return;
        }

        // Create a simple video export using frame URLs
        const frameUrls = animation.frames
          .filter(f => f.loaded && f.url)
          .map(f => f.url);

        if (frameUrls.length === 0) {
          alert('No valid frames found for video export');
          return;
        }

        const response = await fetch(`${apiUrl}/api/earthdata-export/create-video`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frameUrls,
            format,
            fps: animation.speed,
            quality: 'medium',
            width: 800,
            height: 600
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const exportId = result.exportId;
            setExportJobs(prev => ({ ...prev, [format]: exportId }));
            
            // Start polling export status
            pollExportStatus(exportId, format);
            
            console.log(`Started ${format.toUpperCase()} export from frames:`, exportId);
          } else {
            throw new Error(result.error || `Failed to start ${format.toUpperCase()} export`);
          }
        } else {
          // If video creation endpoint doesn't exist, fall back to downloading frames
          console.log('Video export not available, offering frame download instead');
          downloadFrames();
          alert(`${format.toUpperCase()} export not available. Downloading frames as ZIP instead.`);
        }
      }
    } catch (error) {
      console.error(`Export ${format} error:`, error);
      setExportStatus(prev => ({ 
        ...prev, 
        [format]: { status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' }
      }));
    }
  };

  // Poll export status
  const pollExportStatus = (exportId: string, format: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
        
        // Determine which endpoint to use based on export ID
        const isVideoExport = exportId.startsWith('video_');
        const statusUrl = isVideoExport 
          ? `${apiUrl}/api/earthdata-export/video-status/${exportId}`
          : `${apiUrl}/api/animation/export-status/${exportId}`;
        
        const response = await fetch(statusUrl);
        const result = await response.json();
        
        setExportStatus(prev => ({ ...prev, [format]: result }));
        
        if (result.status === 'completed') {
          clearInterval(pollInterval);
          console.log(`${format.toUpperCase()} export completed:`, result.downloadUrl);
          
          // Auto-download the file
          if (result.downloadUrl) {
            const downloadUrl = result.downloadUrl.startsWith('http') 
              ? result.downloadUrl 
              : `${apiUrl}${result.downloadUrl}`;
            window.open(downloadUrl, '_blank');
          }
        } else if (result.status === 'failed') {
          clearInterval(pollInterval);
          console.error(`${format.toUpperCase()} export failed:`, result.error);
        }
      } catch (error) {
        console.error(`Error checking ${format} export status:`, error);
        // If the status check fails, try to gracefully handle it
        setExportStatus(prev => ({ 
          ...prev, 
          [format]: { status: 'failed', error: 'Status check failed' }
        }));
        clearInterval(pollInterval);
      }
    }, 3000); // Check every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 300000);
  };

  // Download frames as ZIP
  const downloadFrames = () => {
    if (generationJobs.length === 0) {
      alert('No animation job available for download');
      return;
    }

    const jobId = generationJobs[0];
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
    window.open(`${apiUrl}/api/animation/download-frames/${jobId}`, '_blank');
  };

  const currentFrame = animation.frames[animation.currentIndex];

  const regions = {
    global: 'Global',
    north_america: 'North America',
    europe: 'Europe',
    asia: 'Asia'
  };

  const speedOptions = [
    { value: 0.5, label: '0.5x (Very Slow)' },
    { value: 1, label: '1x (Slow)' },
    { value: 2, label: '2x (Normal)' },
    { value: 4, label: '4x (Fast)' },
    { value: 8, label: '8x (Very Fast)' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      
      {/* Main Content with top padding to account for fixed navigation */}
      <div className="pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Zap className="text-yellow-400" />
              Satellite Animation Studio
            </h1>
            <p className="text-gray-300">
              Create time-lapse animations from NASA satellite imagery
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Configuration Panel */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Settings className="text-blue-400" />
                  Animation Configuration
              </h2>

              <div className="space-y-4">
                {/* Layer Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Satellite Layer
                  </label>
                  <select
                    value={config.layer}
                    onChange={(e) => setConfig(prev => ({ ...prev, layer: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                    disabled={animation.loading}
                  >
                    {Object.entries(availableLayers).map(([key, layer]: [string, any]) => (
                      <option key={key} value={key}>
                        {layer.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={config.startDate}
                      onChange={(e) => setConfig(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                      disabled={animation.loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={config.endDate}
                      onChange={(e) => setConfig(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                      disabled={animation.loading}
                    />
                  </div>
                </div>

                {/* Region */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Region
                  </label>
                  <select
                    value={config.region}
                    onChange={(e) => setConfig(prev => ({ ...prev, region: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                    disabled={animation.loading}
                  >
                    {Object.entries(regions).map(([key, name]) => (
                      <option key={key} value={key}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateAnimation}
                  disabled={animation.loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {animation.loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Image size={16} />
                      Generate Animation
                    </>
                  )}
                </button>

                {/* Frame Count Info */}
                {config.startDate && config.endDate && (
                  <div className="text-sm text-gray-400 text-center">
                    {generateDateRange(config.startDate, config.endDate).length} frames
                  </div>
                )}
              </div>
            </div>

            {/* Playback Controls */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Play className="text-green-400" />
                Playback Controls
              </h2>

              <div className="space-y-4">
                {/* Speed Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Speed
                  </label>
                  <select
                    value={animation.speed}
                    onChange={(e) => handleSpeedChange(Number(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                  >
                    {speedOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Loop Control */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="loop"
                    checked={animation.loop}
                    onChange={(e) => setAnimation(prev => ({ ...prev, loop: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="loop" className="text-sm text-gray-300">
                    Loop animation
                  </label>
                </div>

                {/* Transport Controls */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={stepBackward}
                    disabled={animation.frames.length === 0 || animation.currentIndex === 0}
                    className="p-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-lg transition-colors"
                  >
                    <SkipBack size={20} />
                  </button>
                  
                  <button
                    onClick={togglePlayback}
                    disabled={animation.frames.length === 0 || loadedFrames === 0}
                    className="p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition-colors"
                  >
                    {animation.isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>
                  
                  <button
                    onClick={stepForward}
                    disabled={animation.frames.length === 0 || animation.currentIndex === animation.frames.length - 1}
                    className="p-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-lg transition-colors"
                  >
                    <SkipForward size={20} />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Frame {animation.currentIndex + 1} of {animation.frames.length}</span>
                    <span>{currentFrame?.date}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Loading Progress */}
                {animation.loading && (
                  <div className="space-y-4">
                    <LoadingSpinner 
                      size={48} 
                      message={`Loading frames (${loadedFrames}/${animation.frames.length})`}
                      className="py-4"
                    />
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${loadingProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Animation Display */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="text-purple-400" />
                Animation Preview
              </h2>

              <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                {animation.error && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-red-400 mb-2">Error</div>
                      <div className="text-gray-300 text-sm">{animation.error}</div>
                    </div>
                  </div>
                )}

                {!animation.error && animation.frames.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Image size={48} className="mx-auto text-gray-500 mb-4" />
                      <div className="text-gray-400">Generate an animation to get started</div>
                    </div>
                  </div>
                )}

                {currentFrame && (
                  <div className="relative w-full h-full">
                    {currentFrame.loaded ? (
                      <img
                        src={currentFrame.url}
                        alt={`Satellite image for ${currentFrame.date}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          console.error('Image load error for URL:', currentFrame.url);
                          console.error('Error event:', e);
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', currentFrame.url);
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
                          <div className="text-gray-400 text-sm">Loading frame for {currentFrame.date}</div>
                          {/* Debug info */}
                          <div className="text-xs text-gray-500 mt-2">
                            URL: {currentFrame.url || 'No URL set'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Frame Info Overlay */}
                    <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
                      {currentFrame.date} | Frame {animation.currentIndex + 1}/{animation.frames.length}
                    </div>

                    {/* Animation Status */}
                    {animation.isPlaying && (
                      <div className="absolute top-4 right-4 bg-green-500 bg-opacity-80 text-white px-2 py-1 rounded-lg text-sm flex items-center gap-1">
                        <Play size={12} />
                        Playing
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Animation Info */}
              {animation.frames.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-gray-300">Total Frames</div>
                    <div className="text-xl font-semibold">{animation.frames.length}</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-gray-300">Loaded Frames</div>
                    <div className="text-xl font-semibold text-green-400">{loadedFrames}</div>
                  </div>
                </div>
              )}

              {/* Export Options */}
              {animation.frames.length > 0 && loadedFrames === animation.frames.length && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                    <Download className="text-blue-400" />
                    Export Options
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* MP4 Export */}
                    <button
                      onClick={() => exportVideo('mp4')}
                      disabled={exportStatus.mp4?.status === 'processing'}
                      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-3 rounded-lg transition-colors"
                    >
                      {exportStatus.mp4?.status === 'processing' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          Export MP4
                        </>
                      )}
                    </button>

                    {/* GIF Export */}
                    <button
                      onClick={() => exportVideo('gif')}
                      disabled={exportStatus.gif?.status === 'processing'}
                      className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-3 rounded-lg transition-colors"
                    >
                      {exportStatus.gif?.status === 'processing' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          Export GIF
                        </>
                      )}
                    </button>

                    {/* Frames ZIP Download */}
                    <button
                      onClick={downloadFrames}
                      className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg transition-colors"
                    >
                      <Download size={16} />
                      Download Frames
                    </button>
                  </div>

                  {/* Export Status */}
                  {(exportStatus.mp4 || exportStatus.gif) && (
                    <div className="space-y-2">
                      {exportStatus.mp4 && (
                        <div className="bg-gray-700 rounded-lg p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span>MP4 Export</span>
                            <span className={`px-2 py-1 rounded ${
                              exportStatus.mp4.status === 'completed' ? 'bg-green-600' :
                              exportStatus.mp4.status === 'processing' ? 'bg-yellow-600' :
                              exportStatus.mp4.status === 'failed' ? 'bg-red-600' : 'bg-gray-600'
                            }`}>
                              {exportStatus.mp4.status}
                            </span>
                          </div>
                          {exportStatus.mp4.status === 'failed' && exportStatus.mp4.error && (
                            <div className="mt-2 text-xs text-red-300">
                              {exportStatus.mp4.error}
                            </div>
                          )}
                          {exportStatus.mp4.status === 'processing' && exportStatus.mp4.progress && (
                            <div className="mt-2 text-xs text-yellow-300">
                              Progress: {exportStatus.mp4.progress}%
                            </div>
                          )}
                        </div>
                      )}
                      {exportStatus.gif && (
                        <div className="bg-gray-700 rounded-lg p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span>GIF Export</span>
                            <span className={`px-2 py-1 rounded ${
                              exportStatus.gif.status === 'completed' ? 'bg-green-600' :
                              exportStatus.gif.status === 'processing' ? 'bg-yellow-600' :
                              exportStatus.gif.status === 'failed' ? 'bg-red-600' : 'bg-gray-600'
                            }`}>
                              {exportStatus.gif.status}
                            </span>
                          </div>
                          {exportStatus.gif.status === 'failed' && exportStatus.gif.error && (
                            <div className="mt-2 text-xs text-red-300">
                              {exportStatus.gif.error}
                            </div>
                          )}
                          {exportStatus.gif.status === 'processing' && exportStatus.gif.progress && (
                            <div className="mt-2 text-xs text-yellow-300">
                              Progress: {exportStatus.gif.progress}%
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}