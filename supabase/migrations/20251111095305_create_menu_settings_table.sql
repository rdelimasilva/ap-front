/*
  # Create menu settings table

  1. New Tables
    - `menu_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `settings` (jsonb) - stores menu visibility configuration
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `menu_settings` table
    - Add policy for users to read their own settings
    - Add policy for users to insert their own settings
    - Add policy for users to update their own settings
  
  3. Notes
    - Each user can have only one settings record
    - Settings are stored as JSONB for flexibility
    - Automatic timestamp updates on modification
*/

CREATE TABLE IF NOT EXISTS menu_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{
    "scheduleView": true,
    "formalization": true,
    "contractsMenu": true,
    "monitoring": true,
    "settlementControl": true,
    "optIn": true,
    "settlementDomicile": true,
    "partnerRegistration": true
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE menu_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own menu settings"
  ON menu_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own menu settings"
  ON menu_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own menu settings"
  ON menu_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_menu_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
CREATE TRIGGER menu_settings_updated_at
  BEFORE UPDATE ON menu_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_settings_updated_at();