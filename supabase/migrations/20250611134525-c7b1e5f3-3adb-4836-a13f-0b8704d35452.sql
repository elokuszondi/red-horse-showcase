
-- Create guest_sessions table for guest mode functionality (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.guest_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on guest_sessions
ALTER TABLE public.guest_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing guest_sessions policies if they exist and recreate
DROP POLICY IF EXISTS "Anyone can manage guest sessions" ON public.guest_sessions;

-- RLS Policies for guest_sessions (open access for guest functionality)
CREATE POLICY "Anyone can manage guest sessions" ON public.guest_sessions
  FOR ALL USING (true);

-- Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_guest_sessions_session_id ON public.guest_sessions(session_id);
