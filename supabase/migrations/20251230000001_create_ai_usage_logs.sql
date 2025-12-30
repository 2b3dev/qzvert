-- Create AI Usage Logs table for tracking Gemini API usage
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('summarize', 'craft', 'translate', 'generate_quiz', 'generate_quest', 'generate_lesson', 'deep_lesson')),
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  model TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_action ON public.ai_usage_logs(action);

-- Enable RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (for anonymous usage tracking)
CREATE POLICY "Anyone can insert AI usage logs"
  ON public.ai_usage_logs
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Policy: Admins can read all logs, users can read their own
-- Combined into single policy for better performance (avoids multiple permissive policy evaluation)
CREATE POLICY "Authenticated users can read AI usage logs"
  ON public.ai_usage_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can delete logs
CREATE POLICY "Admins can delete AI usage logs"
  ON public.ai_usage_logs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Add comment
COMMENT ON TABLE public.ai_usage_logs IS 'Tracks Gemini API usage for monitoring and cost estimation';
