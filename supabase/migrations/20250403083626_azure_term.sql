/*
  # Bug Tracker Schema Update

  1. Tables
    - `bugs`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `status` (text)
      - `priority` (text)
      - `assigned_to` (text)
      - `created_by` (uuid)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for viewing, creating, and updating bugs
    - Ensure safe policy creation with existence checks
*/

-- First, check and drop existing policies
DO $$ 
BEGIN
  -- Drop view policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'bugs' 
    AND policyname = 'Users can view all bugs'
  ) THEN
    DROP POLICY IF EXISTS "Users can view all bugs" ON bugs;
  END IF;

  -- Drop create policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'bugs' 
    AND policyname = 'Users can create bugs'
  ) THEN
    DROP POLICY IF EXISTS "Users can create bugs" ON bugs;
  END IF;

  -- Drop update policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'bugs' 
    AND policyname = 'Users can update their bugs'
  ) THEN
    DROP POLICY IF EXISTS "Users can update their bugs" ON bugs;
  END IF;
END $$;

-- Create bugs table if it doesn't exist
CREATE TABLE IF NOT EXISTS bugs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  assigned_to text,
  created_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'critical'))
);

-- Enable Row Level Security
ALTER TABLE bugs ENABLE ROW LEVEL SECURITY;

-- Create policies with IF NOT EXISTS checks
DO $$ 
BEGIN
  -- Create view policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'bugs' 
    AND policyname = 'Users can view all bugs'
  ) THEN
    CREATE POLICY "Users can view all bugs"
      ON bugs
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- Create insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'bugs' 
    AND policyname = 'Users can create bugs'
  ) THEN
    CREATE POLICY "Users can create bugs"
      ON bugs
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = created_by);
  END IF;

  -- Create update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'bugs' 
    AND policyname = 'Users can update their bugs'
  ) THEN
    CREATE POLICY "Users can update their bugs"
      ON bugs
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = created_by);
  END IF;
END $$;

-- Create or replace the updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and create it
DROP TRIGGER IF EXISTS update_bugs_updated_at ON bugs;
CREATE TRIGGER update_bugs_updated_at
  BEFORE UPDATE ON bugs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();