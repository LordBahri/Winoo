-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for fuzzy text search

-- Ensure read replica user exists (for future replicas)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'petid_readonly') THEN
    CREATE ROLE petid_readonly WITH LOGIN PASSWORD 'readonly_password';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE petid TO petid_readonly;
GRANT USAGE ON SCHEMA public TO petid_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO petid_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO petid_readonly;
