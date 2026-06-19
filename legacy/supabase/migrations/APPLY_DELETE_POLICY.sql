-- =====================================================
-- APPLY: Add DELETE policy for contest_registrations
-- USAGE: Copy-paste this SQL in Supabase SQL Editor
-- =====================================================

-- Users can delete their own pending registrations
CREATE POLICY "Users can delete own pending registrations"
  ON public.contest_registrations
  FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins can delete any registration
CREATE POLICY "Admins can delete all registrations"
  ON public.contest_registrations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Grant DELETE permission
GRANT DELETE ON public.contest_registrations TO authenticated;
