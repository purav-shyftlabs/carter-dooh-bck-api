-- Migration: Add file storage fields to file table
-- Date: 2024-01-XX
-- Description: Add storage-related fields to support local S3-compatible storage

-- Add storage-related columns to file table
ALTER TABLE file 
ADD COLUMN storage_key VARCHAR(500),
ADD COLUMN file_size BIGINT,
ADD COLUMN content_type VARCHAR(255),
ADD COLUMN etag VARCHAR(255);

-- Add indexes for better performance
CREATE INDEX idx_file_storage_key ON file(storage_key);
CREATE INDEX idx_file_content_type ON file(content_type);
CREATE INDEX idx_file_size ON file(file_size);

-- Add comments for documentation
COMMENT ON COLUMN file.storage_key IS 'Unique storage key for the file (S3-compatible)';
COMMENT ON COLUMN file.file_size IS 'File size in bytes';
COMMENT ON COLUMN file.content_type IS 'MIME type of the file';
COMMENT ON COLUMN file.etag IS 'ETag for file integrity checking';

-- Update existing files to have default values (if any exist)
UPDATE file 
SET 
  storage_key = NULL,
  file_size = NULL,
  content_type = 'application/octet-stream',
  etag = NULL
WHERE storage_key IS NULL;
