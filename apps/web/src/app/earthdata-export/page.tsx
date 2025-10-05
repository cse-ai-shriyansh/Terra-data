'use client';

import React, { useState } from 'react';
import { Calendar, Download, Globe, Image, Settings, Clock } from 'lucide-react';

interface ExportJob {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  filename?: string;
  downloadUrl?: string;
  parameters: any;
  startedAt: Date;
  completedAt?: Date;
}

export default function EarthdataExportPage() {
  const [exportParams, setExportParams] = useState({
    layer: 'terra_true_color',
    date: '2024-10-01',
    method: 'direct',
    width: 3840,
    height: 2160,
    zoom: 2,
    region: 'global'
  });

  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [availableLayers, setAvailableLayers] = useState<any>({});

  React.useEffect(() => {
    // Load available layers
    fetch('/api/earthdata-export/layers')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAvailableLayers(data.layers);
        }
      })
      .catch(console.error);
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const response = await fetch('/api/earthdata-export/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportParams),
      });

      const result = await response.json();

      if (result.success) {
        const newJob: ExportJob = {
          jobId: result.jobId,
          status: 'processing',
          parameters: result.parameters,
          startedAt: new Date()
        };

        setJobs(prev => [newJob, ...prev]);
        
        // Start polling for status
        pollJobStatus(result.jobId);
      } else {
        alert(`Export failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/earthdata-export/status/${jobId}`);
        const result = await response.json();

        if (result.status === 'completed') {
          setJobs(prev => prev.map(job => 
            job.jobId === jobId 
              ? {
                  ...job,
                  status: 'completed',
                  filename: result.filename,
                  downloadUrl: result.downloadUrl,
                  completedAt: new Date(result.completedAt)
                }
              : job
          ));
          clearInterval(pollInterval);
        } else if (result.status === 'failed') {
          setJobs(prev => prev.map(job => 
            job.jobId === jobId ? { ...job, status: 'failed' } : job
          ));
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Status polling error:', error);
        clearInterval(pollInterval);
      }
    }, 2000);

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 300000);
  };

  const regions = {
    global: 'Global',
    north_america: 'North America',
    europe: 'Europe',
    asia: 'Asia',
    africa: 'Africa',
    south_america: 'South America',
    australia: 'Australia',
    arctic: 'Arctic',
    antarctic: 'Antarctic'
  };

  const methods = {
    direct: 'Direct GIBS (High Quality)',
    wms: 'WMS Service',
    worldview: 'NASA Worldview'
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Globe className="text-blue-400" />
            NASA Earthdata Image Export
          </h1>
          <p className="text-gray-300">
            Export high-quality satellite imagery directly from NASA's Earthdata services
          </p>
        </div>

        {/* Export Configuration */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Settings className="text-green-400" />
              Export Configuration
            </h2>

            <div className="space-y-4">
              {/* Layer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Satellite Layer
                </label>
                <select
                  value={exportParams.layer}
                  onChange={(e) => setExportParams(prev => ({ ...prev, layer: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(availableLayers).map(([key, layer]: [string, any]) => (
                    <option key={key} value={key}>
                      {layer.name} ({layer.resolution})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={exportParams.date}
                  onChange={(e) => setExportParams(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Method */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Export Method
                </label>
                <select
                  value={exportParams.method}
                  onChange={(e) => setExportParams(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(methods).map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Region */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Region
                </label>
                <select
                  value={exportParams.region}
                  onChange={(e) => setExportParams(prev => ({ ...prev, region: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(regions).map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Width
                  </label>
                  <input
                    type="number"
                    value={exportParams.width}
                    onChange={(e) => setExportParams(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Height
                  </label>
                  <input
                    type="number"
                    value={exportParams.height}
                    onChange={(e) => setExportParams(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Zoom Level (for direct method) */}
              {exportParams.method === 'direct' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Zoom Level
                  </label>
                  <select
                    value={exportParams.zoom}
                    onChange={(e) => setExportParams(prev => ({ ...prev, zoom: parseInt(e.target.value) }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1 - Lowest Quality (Fast)</option>
                    <option value={2}>2 - Good Quality</option>
                    <option value={3}>3 - High Quality</option>
                    <option value={4}>4 - Highest Quality (Slow)</option>
                  </select>
                </div>
              )}

              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Start Export
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview/Info */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Image className="text-purple-400" />
              Export Preview
            </h2>

            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium mb-2">Current Configuration:</h3>
                <div className="text-sm text-gray-300 space-y-1">
                  <div><strong>Layer:</strong> {availableLayers[exportParams.layer]?.name || exportParams.layer}</div>
                  <div><strong>Date:</strong> {exportParams.date}</div>
                  <div><strong>Method:</strong> {methods[exportParams.method as keyof typeof methods]}</div>
                  <div><strong>Region:</strong> {regions[exportParams.region as keyof typeof regions]}</div>
                  <div><strong>Size:</strong> {exportParams.width} × {exportParams.height}</div>
                  {exportParams.method === 'direct' && (
                    <div><strong>Zoom:</strong> Level {exportParams.zoom}</div>
                  )}
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium mb-2">Estimated File Size:</h3>
                <div className="text-sm text-gray-300">
                  {exportParams.method === 'direct' ? '1-3 MB (High Quality)' : '0.5-1.5 MB'}
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium mb-2">Estimated Time:</h3>
                <div className="text-sm text-gray-300">
                  {exportParams.method === 'direct' ? '30-60 seconds' : '10-30 seconds'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Jobs */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="text-orange-400" />
            Export Jobs
          </h2>

          {jobs.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No export jobs yet. Start your first export above!</p>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.jobId} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        job.status === 'completed' ? 'bg-green-400' :
                        job.status === 'processing' ? 'bg-yellow-400 animate-pulse' :
                        'bg-red-400'
                      }`}></div>
                      <span className="font-medium">
                        {availableLayers[job.parameters.layer]?.name || job.parameters.layer}
                      </span>
                      <span className="text-gray-400">({job.parameters.date})</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {job.status === 'processing' && 'Processing...'}
                      {job.status === 'completed' && 'Completed'}
                      {job.status === 'failed' && 'Failed'}
                    </div>
                  </div>

                  <div className="text-sm text-gray-300 mb-3">
                    Started: {job.startedAt.toLocaleString()}
                    {job.completedAt && (
                      <span className="ml-4">
                        Completed: {job.completedAt.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {job.status === 'completed' && job.downloadUrl && (
                    <a
                      href={job.downloadUrl}
                      download={job.filename}
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Download size={16} />
                      Download ({job.filename})
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}