/**
 * Job Storage Utility
 * File-based job metadata storage (use database in production)
 */

import fs from 'fs/promises';
import path from 'path';
import { Job, JobStatus } from '../types/jobs';
import { logger } from './logger';

const DATA_DIR = path.join(process.cwd(), 'data');
const JOBS_DIR = path.join(DATA_DIR, 'jobs');

// Ensure data directories exist
async function ensureDirectories(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(JOBS_DIR, { recursive: true });
  } catch (error) {
    logger.error('Failed to create data directories:', error);
  }
}

// Initialize directories on import
ensureDirectories();

/**
 * Save job metadata to file
 */
export async function saveJobMetadata(job: Job): Promise<void> {
  try {
    const filePath = path.join(JOBS_DIR, `${job.id}.json`);
    const jobData = {
      ...job,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      completedAt: job.completedAt?.toISOString(),
    };
    
    await fs.writeFile(filePath, JSON.stringify(jobData, null, 2), 'utf-8');
    logger.debug(`Saved job metadata for ${job.id}`);
  } catch (error) {
    logger.error(`Failed to save job metadata for ${job.id}:`, error);
    throw error;
  }
}

/**
 * Load job metadata from file
 */
export async function loadJobMetadata(jobId: string): Promise<Job | null> {
  try {
    const filePath = path.join(JOBS_DIR, `${jobId}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    const jobData = JSON.parse(data);
    
    // Convert date strings back to Date objects
    return {
      ...jobData,
      createdAt: new Date(jobData.createdAt),
      updatedAt: new Date(jobData.updatedAt),
      completedAt: jobData.completedAt ? new Date(jobData.completedAt) : undefined,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null; // File doesn't exist
    }
    logger.error(`Failed to load job metadata for ${jobId}:`, error);
    throw error;
  }
}

/**
 * Update job status
 */
export async function updateJobStatus(
  jobId: string, 
  status: JobStatus, 
  updates: Partial<Job> = {}
): Promise<void> {
  try {
    const job = await loadJobMetadata(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const updatedJob = {
      ...job,
      ...updates,
      status,
      updatedAt: new Date(),
      completedAt: status === JobStatus.COMPLETED ? new Date() : job.completedAt,
    };

    await saveJobMetadata(updatedJob as any);
    logger.debug(`Updated job ${jobId} status to ${status}`);
  } catch (error) {
    logger.error(`Failed to update job status for ${jobId}:`, error);
    throw error;
  }
}

/**
 * List all jobs with optional filtering
 */
export async function listJobs(filter?: {
  status?: JobStatus;
  type?: string;
  limit?: number;
}): Promise<Job[]> {
  try {
    const files = await fs.readdir(JOBS_DIR);
    const jobFiles = files.filter(file => file.endsWith('.json'));
    
    const jobs: Job[] = [];
    
    for (const file of jobFiles) {
      try {
        const jobId = path.basename(file, '.json');
        const job = await loadJobMetadata(jobId);
        
        if (job) {
          // Apply filters
          if (filter?.status && job.status !== filter.status) continue;
          if (filter?.type && job.type !== filter.type) continue;
          
          jobs.push(job);
        }
      } catch (error) {
        logger.warn(`Failed to load job from file ${file}:`, error);
      }
    }
    
    // Sort by creation date (newest first)
    jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Apply limit
    if (filter?.limit) {
      return jobs.slice(0, filter.limit);
    }
    
    return jobs;
  } catch (error) {
    logger.error('Failed to list jobs:', error);
    throw error;
  }
}

/**
 * Delete job metadata
 */
export async function deleteJobMetadata(jobId: string): Promise<void> {
  try {
    const filePath = path.join(JOBS_DIR, `${jobId}.json`);
    await fs.unlink(filePath);
    logger.debug(`Deleted job metadata for ${jobId}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      logger.warn(`Job metadata file for ${jobId} not found`);
      return; // File doesn't exist, consider it deleted
    }
    logger.error(`Failed to delete job metadata for ${jobId}:`, error);
    throw error;
  }
}

/**
 * Clean up old completed jobs (older than specified days)
 */
export async function cleanupOldJobs(olderThanDays: number = 30): Promise<number> {
  try {
    const jobs = await listJobs();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let cleanedCount = 0;
    
    for (const job of jobs) {
      if (
        (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) &&
        job.completedAt &&
        job.completedAt < cutoffDate
      ) {
        await deleteJobMetadata(job.id);
        cleanedCount++;
      }
    }
    
    logger.info(`Cleaned up ${cleanedCount} old jobs`);
    return cleanedCount;
  } catch (error) {
    logger.error('Failed to cleanup old jobs:', error);
    throw error;
  }
}

/**
 * Get job statistics
 */
export async function getJobStats(): Promise<{
  total: number;
  byStatus: Record<JobStatus, number>;
  byType: Record<string, number>;
}> {
  try {
    const jobs = await listJobs();
    
    const stats = {
      total: jobs.length,
      byStatus: {
        [JobStatus.PENDING]: 0,
        [JobStatus.PROCESSING]: 0,
        [JobStatus.COMPLETED]: 0,
        [JobStatus.FAILED]: 0,
        [JobStatus.CANCELLED]: 0,
      },
      byType: {} as Record<string, number>,
    };
    
    for (const job of jobs) {
      stats.byStatus[job.status]++;
      stats.byType[job.type] = (stats.byType[job.type] || 0) + 1;
    }
    
    return stats;
  } catch (error) {
    logger.error('Failed to get job stats:', error);
    throw error;
  }
}