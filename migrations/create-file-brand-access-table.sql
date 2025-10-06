-- Create file_brand_access table for specific brand access control
-- This table links files to specific brands that can access them

-- First, check if required parent tables exist
DO $$
BEGIN
    -- Check if 'file' table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'file') THEN
        RAISE EXCEPTION 'Parent table "file" does not exist. Please create it first.';
    END IF;
    
    -- Check if 'brand' table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brand') THEN
        RAISE EXCEPTION 'Parent table "brand" does not exist. Please create it first.';
    END IF;
    
    -- Check if 'file' table has 'id' column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'file' AND column_name = 'id') THEN
        RAISE EXCEPTION 'Parent table "file" does not have "id" column.';
    END IF;
    
    -- Check if 'brand' table has 'id' column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brand' AND column_name = 'id') THEN
        RAISE EXCEPTION 'Parent table "brand" does not have "id" column.';
    END IF;
    
    RAISE NOTICE 'All parent tables and columns exist. Proceeding with file_brand_access table creation.';
END $$;

-- Drop table if it exists (for clean recreation)
DROP TABLE IF EXISTS file_brand_access CASCADE;

-- Create the file_brand_access table
CREATE TABLE file_brand_access (
    id BIGSERIAL PRIMARY KEY,
    file_id BIGINT NOT NULL REFERENCES file(id) ON DELETE CASCADE,
    brand_id BIGINT NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(file_id, brand_id)
);

-- Create indexes for better performance
CREATE INDEX idx_file_brand_access_file_id ON file_brand_access(file_id);
CREATE INDEX idx_file_brand_access_brand_id ON file_brand_access(brand_id);
CREATE INDEX idx_file_brand_access_created_at ON file_brand_access(created_at);

-- Add comments for documentation
COMMENT ON TABLE file_brand_access IS 'Maps files to specific brands for access control';
COMMENT ON COLUMN file_brand_access.id IS 'Primary key';
COMMENT ON COLUMN file_brand_access.file_id IS 'ID of the file';
COMMENT ON COLUMN file_brand_access.brand_id IS 'ID of the brand that can access this file';
COMMENT ON COLUMN file_brand_access.created_at IS 'When the access record was created';
COMMENT ON COLUMN file_brand_access.updated_at IS 'When the access record was last updated';

-- Insert sample data (optional)
-- INSERT INTO file_brand_access (file_id, brand_id) VALUES (1, 1), (1, 2), (2, 1);

-- Verify table was created successfully
DO $$
BEGIN
    -- Check if file_brand_access table was created
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'file_brand_access') THEN
        RAISE NOTICE 'SUCCESS: file_brand_access table created successfully!';
    ELSE
        RAISE EXCEPTION 'FAILED: file_brand_access table was not created.';
    END IF;
    
    -- Check if foreign key constraints exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'file_brand_access' 
               AND constraint_type = 'FOREIGN KEY') THEN
        RAISE NOTICE 'SUCCESS: Foreign key constraints created successfully!';
    ELSE
        RAISE WARNING 'WARNING: Foreign key constraints may not have been created.';
    END IF;
    
    -- Check if indexes were created
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'file_brand_access') THEN
        RAISE NOTICE 'SUCCESS: Indexes created successfully!';
    ELSE
        RAISE WARNING 'WARNING: Indexes may not have been created.';
    END IF;
END $$;

-- Show table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'file_brand_access'
ORDER BY ordinal_position;

-- Show indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'file_brand_access';

-- Show foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'file_brand_access';
