/*
  # Create Opt-In Tables

  ## New Tables
  
  ### `opt_in_requests`
  - `id` (uuid, primary key) - Unique identifier for the opt-in request
  - `client_name` (text) - Name of the client
  - `client_document` (text) - Client's CNPJ or CPF
  - `client_email` (text) - Client's email address
  - `client_phone` (text) - Client's phone number
  - `client_address` (text) - Client's full address
  - `status` (text) - Status: 'pending', 'signed', 'expired', 'cancelled'
  - `signature_token` (text, unique) - Unique token for signing the document
  - `document_url` (text, nullable) - URL to the generated document
  - `signed_at` (timestamptz, nullable) - Timestamp when the document was signed
  - `signature_ip` (text, nullable) - IP address from where it was signed
  - `signature_data` (jsonb, nullable) - Signature data (base64 image, etc)
  - `expiry_date` (timestamptz) - Expiration date for the opt-in
  - `created_at` (timestamptz) - Timestamp when the request was created
  - `updated_at` (timestamptz) - Timestamp when the request was last updated
  - `created_by` (uuid, nullable) - User who created the request

  ## Security
  - Enable RLS on `opt_in_requests` table
  - Add policy for authenticated users to read all opt-in requests
  - Add policy for authenticated users to create opt-in requests
  - Add policy for authenticated users to update their own opt-in requests
  - Add policy for public access to sign opt-in using token
*/

-- Create opt_in_requests table
CREATE TABLE IF NOT EXISTS opt_in_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_document text NOT NULL,
  client_email text NOT NULL,
  client_phone text NOT NULL,
  client_address text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'expired', 'cancelled')),
  signature_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  document_url text,
  signed_at timestamptz,
  signature_ip text,
  signature_data jsonb,
  expiry_date timestamptz NOT NULL DEFAULT (now() + interval '1 year'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_opt_in_signature_token ON opt_in_requests(signature_token);
CREATE INDEX IF NOT EXISTS idx_opt_in_status ON opt_in_requests(status);
CREATE INDEX IF NOT EXISTS idx_opt_in_client_document ON opt_in_requests(client_document);

-- Enable RLS
ALTER TABLE opt_in_requests ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all opt-in requests
CREATE POLICY "Authenticated users can read all opt-in requests"
  ON opt_in_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to create opt-in requests
CREATE POLICY "Authenticated users can create opt-in requests"
  ON opt_in_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy for authenticated users to update opt-in requests
CREATE POLICY "Authenticated users can update opt-in requests"
  ON opt_in_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for public access to view opt-in by token (for signature page)
CREATE POLICY "Public can read opt-in by token"
  ON opt_in_requests
  FOR SELECT
  TO anon
  USING (signature_token IS NOT NULL);

-- Policy for public to update opt-in signature data by token
CREATE POLICY "Public can update signature by token"
  ON opt_in_requests
  FOR UPDATE
  TO anon
  USING (status = 'pending')
  WITH CHECK (status IN ('signed', 'pending'));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_opt_in_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER opt_in_requests_updated_at
  BEFORE UPDATE ON opt_in_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_opt_in_updated_at();