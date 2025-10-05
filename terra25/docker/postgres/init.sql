-- Terra25 Database Initialization Script
-- This script sets up the database schema for the Terra25 application

\c terra25;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Jobs table for tracking ingestion and export jobs
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'ingest' or 'export'
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB,
    result_url TEXT
);

-- Ingestion requests table
CREATE TABLE IF NOT EXISTS ingest_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    layer VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    bbox_north DECIMAL(10, 7) NOT NULL,
    bbox_south DECIMAL(10, 7) NOT NULL,
    bbox_east DECIMAL(10, 7) NOT NULL,
    bbox_west DECIMAL(10, 7) NOT NULL,
    zoom_level INTEGER NOT NULL CHECK (zoom_level >= 1 AND zoom_level <= 10),
    frame_rate INTEGER DEFAULT 10 CHECK (frame_rate >= 1 AND frame_rate <= 30),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Animation frames table
CREATE TABLE IF NOT EXISTS frames (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    frame_index INTEGER NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    layer VARCHAR(255) NOT NULL,
    bbox_north DECIMAL(10, 7) NOT NULL,
    bbox_south DECIMAL(10, 7) NOT NULL,
    bbox_east DECIMAL(10, 7) NOT NULL,
    bbox_west DECIMAL(10, 7) NOT NULL,
    zoom_level INTEGER NOT NULL,
    file_size BIGINT,
    s3_key VARCHAR(500) NOT NULL,
    thumbnail_key VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_id, frame_index)
);

-- Export requests table
CREATE TABLE IF NOT EXISTS export_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    source_job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    format VARCHAR(20) NOT NULL CHECK (format IN ('mp4', 'gif', 'zip', 'webm')),
    quality INTEGER CHECK (quality >= 1 AND quality <= 100),
    fps INTEGER CHECK (fps >= 1 AND fps <= 60),
    width INTEGER CHECK (width >= 100 AND width <= 4000),
    height INTEGER CHECK (height >= 100 AND height <= 4000),
    loop_enabled BOOLEAN DEFAULT true,
    file_size BIGINT,
    s3_key VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Terra layer configurations
CREATE TABLE IF NOT EXISTS terra_layers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    layer_name VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    wmts_layer VARCHAR(255) NOT NULL,
    tile_matrix_set VARCHAR(100) NOT NULL DEFAULT 'GoogleMapsCompatible_Level9',
    image_format VARCHAR(20) NOT NULL DEFAULT 'image/jpeg',
    available_from DATE,
    available_to DATE,
    temporal_resolution VARCHAR(50), -- 'daily', 'weekly', etc.
    spatial_resolution VARCHAR(50), -- '250m', '1km', etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions (optional, for future use)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_identifier VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    user_identifier VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    request_size BIGINT,
    response_size BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_frames_job_id ON frames(job_id);
CREATE INDEX IF NOT EXISTS idx_frames_timestamp ON frames(timestamp);
CREATE INDEX IF NOT EXISTS idx_ingest_requests_job_id ON ingest_requests(job_id);
CREATE INDEX IF NOT EXISTS idx_export_requests_job_id ON export_requests(job_id);
CREATE INDEX IF NOT EXISTS idx_terra_layers_active ON terra_layers(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint);

-- Create a spatial index for bounding boxes (for future geographic queries)
CREATE INDEX IF NOT EXISTS idx_frames_bbox ON frames USING GIST (
    ST_MakeEnvelope(bbox_west, bbox_south, bbox_east, bbox_north, 4326)
);

-- Insert default Terra layer configurations
INSERT INTO terra_layers (layer_name, display_name, description, wmts_layer, temporal_resolution, spatial_resolution) VALUES
    ('MODIS_Terra_CorrectedReflectance_TrueColor', 'Terra True Color', 'MODIS Terra Corrected Reflectance (True Color)', 'MODIS_Terra_CorrectedReflectance_TrueColor', 'daily', '250m'),
    ('MODIS_Terra_CorrectedReflectance_Bands367', 'Terra False Color (367)', 'MODIS Terra Corrected Reflectance (Bands 3-6-7)', 'MODIS_Terra_CorrectedReflectance_Bands367', 'daily', '500m'),
    ('MODIS_Terra_Aerosol', 'Terra Aerosol Optical Depth', 'MODIS Terra Aerosol Optical Depth at 550nm', 'MODIS_Terra_Aerosol', 'daily', '10km'),
    ('MODIS_Terra_Brightness_Temp_Band31_Day', 'Terra Brightness Temperature', 'MODIS Terra Brightness Temperature (Band 31, Day)', 'MODIS_Terra_Brightness_Temp_Band31_Day', 'daily', '1km'),
    ('MODIS_Terra_Land_Surface_Temp_Day', 'Terra Land Surface Temperature', 'MODIS Terra Land Surface Temperature (Day)', 'MODIS_Terra_Land_Surface_Temp_Day', 'daily', '1km'),
    ('MODIS_Terra_Snow_Cover', 'Terra Snow Cover', 'MODIS Terra Snow Cover (Normalized Difference Snow Index)', 'MODIS_Terra_Snow_Cover', 'daily', '500m')
ON CONFLICT (layer_name) DO NOTHING;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to clean up old completed jobs (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_jobs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM jobs 
    WHERE status IN ('completed', 'failed') 
    AND completed_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get job statistics
CREATE OR REPLACE FUNCTION get_job_statistics(start_date DATE DEFAULT NULL, end_date DATE DEFAULT NULL)
RETURNS TABLE(
    total_jobs BIGINT,
    completed_jobs BIGINT,
    failed_jobs BIGINT,
    pending_jobs BIGINT,
    processing_jobs BIGINT,
    avg_processing_time INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_jobs,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_jobs,
        COUNT(*) FILTER (WHERE status = 'processing') as processing_jobs,
        AVG(completed_at - created_at) FILTER (WHERE completed_at IS NOT NULL) as avg_processing_time
    FROM jobs
    WHERE (start_date IS NULL OR created_at::date >= start_date)
    AND (end_date IS NULL OR created_at::date <= end_date);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO terra25;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO terra25;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO terra25;

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'Terra25 database schema initialized successfully!';
    RAISE NOTICE 'Default Terra layers configured.';
    RAISE NOTICE 'Indexes and functions created.';
END $$;