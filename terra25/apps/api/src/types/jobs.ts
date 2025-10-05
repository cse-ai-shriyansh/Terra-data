/**
 * Job Types and Interfaces
 * Type definitions for Terra25 background jobs
 */

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum JobType {
  INGEST = 'ingest',
  EXPORT = 'export',
  FRAME_GENERATION = 'frame_generation',
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface DateRange {
  start: Date; // Changed to Date for consistency
  end: Date;   // Changed to Date for consistency
}

export interface BaseJob {
  id: string;
  type: JobType | string; // Allow string for compatibility
  status: JobStatus;
  progress?: number; // 0-100
  message?: string; // Changed from error to message
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface IngestJobOptions {
  resolution?: string;
  format?: string;
  maxConcurrent?: number;
  skipExisting?: boolean;
  retryFailures?: boolean;
}

export interface IngestJob extends BaseJob {
  type: JobType.INGEST;
  layer: string;
  dateRange: DateRange;
  boundingBox: BoundingBox;
  options: IngestJobOptions;
  frameCount?: number;
  frameUrls?: string[];
}

export interface ExportJobOptions {
  format: 'mp4' | 'gif' | 'webm';
  fps?: number;
  quality?: 'low' | 'medium' | 'high';
  resolution?: string;
  watermark?: boolean;
}

export interface ExportJob extends BaseJob {
  type: JobType.EXPORT;
  ingestJobId: string;
  options: ExportJobOptions;
  outputUrl?: string;
  fileSize?: number;
  duration?: number;
}

export interface FrameJob extends BaseJob {
  type: JobType.FRAME_GENERATION | 'frame_generation';
  params: {
    boundingBox: BoundingBox;
    dateRange: DateRange;
    layers: string[];
    resolution: '250m' | '500m' | '1km';
    frameRate: number;
  };
  frameCount: number;
  framesGenerated: number;
  outputPath?: string;
}

export type Job = IngestJob | ExportJob | FrameJob;

// Job creation payloads
export interface CreateIngestJobPayload {
  layer: string;
  dateRange: DateRange;
  boundingBox: BoundingBox;
  options?: Partial<IngestJobOptions>;
}

export interface CreateExportJobPayload {
  ingestJobId?: string;
  layer?: string;
  dateRange?: DateRange;
  boundingBox?: BoundingBox;
  options: ExportJobOptions;
}

// API Response types
export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  progress?: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface IngestJobResponse extends JobStatusResponse {
  layer: string;
  dateRange: DateRange;
  boundingBox: BoundingBox;
  frameCount?: number;
  frameUrls?: string[];
}

export interface ExportJobResponse extends JobStatusResponse {
  ingestJobId: string;
  format: string;
  outputUrl?: string;
  fileSize?: number;
  duration?: number;
}