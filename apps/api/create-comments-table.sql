-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id uuid NOT NULL REFERENCES escrows(id) ON DELETE CASCADE,
  author varchar(42) NOT NULL,
  author_name varchar(255),
  content text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  metadata jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS comment_escrow_idx ON comments(escrow_id);
CREATE INDEX IF NOT EXISTS comment_author_idx ON comments(author);
CREATE INDEX IF NOT EXISTS comment_created_idx ON comments(created_at);
