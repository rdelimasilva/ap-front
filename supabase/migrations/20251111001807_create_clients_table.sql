/*
  # Create Clients Table

  1. New Tables
    - `clients`
      - `id` (uuid, primary key) - Unique identifier for the client
      - `name` (text) - Client's full name
      - `document` (text, unique) - CPF or CNPJ (unique identifier)
      - `email` (text) - Client's email address
      - `phone` (text) - Client's phone number
      - `address` (text) - Client's address
      - `status` (text) - Client status (active, inactive, blocked)
      - `total_receivables` (numeric) - Total receivables amount
      - `available_receivables` (numeric) - Available receivables amount
      - `blocked_receivables` (numeric) - Blocked receivables amount
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record last update timestamp

  2. Security
    - Enable RLS on `clients` table
    - Add policy for authenticated users to read all clients
    - Add policy for authenticated users to insert clients
    - Add policy for authenticated users to update clients
    - Add policy for authenticated users to delete clients

  3. Indexes
    - Index on document for fast lookups
    - Index on status for filtering
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  document text UNIQUE NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  total_receivables numeric DEFAULT 0,
  available_receivables numeric DEFAULT 0,
  blocked_receivables numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'blocked'))
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_clients_document ON clients(document);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();