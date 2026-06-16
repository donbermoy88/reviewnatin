-- Harden the server-side premium content gate.
--
-- Audit finding P0-2 / P1-1 (audit/android-principal-audit-2026-06-16.md):
-- public.user_has_content_access() gates premium content in many RPCs/RLS but
-- was never updated after the subscription-lifecycle migrations. It checked only
-- `expires_at` and did NOT exclude `source = 'demo'` nor inspect `status` /
-- `revoked_at`. Combined with grant_demo_entitlement (SECURITY DEFINER, granted
-- to authenticated), a logged-in user could self-grant full premium server-side
-- in any environment where `app.demo_entitlements_enabled = 'true'`.
--
-- This redefinition:
--   1. Uses the lifecycle access window COALESCE(grace, current_period_end, expires_at)
--      so subscription rows that set the new fields (not legacy expires_at) are honored.
--   2. Excludes refunded / revoked / expired entitlements (mirrors the client's
--      isActiveEntitlement in apps/mobile/lib/api/entitlements.ts).
--   3. Excludes `source = 'demo'` UNLESS the environment explicitly enables demo
--      entitlements (same flag grant_demo_entitlement is gated by), so dev/demo
--      keeps working while production denies self-granted demo passes.
--
-- NULL access window is still treated as "no expiry" to match the client's
-- active-unless-expired semantics for legitimate lifetime grants; the new status
-- and source filters are what close the bypass.

CREATE OR REPLACE FUNCTION public.user_has_content_access(p_exam_type_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    ELSE EXISTS (
      SELECT 1
      FROM user_entitlements ue
      JOIN subscription_products sp ON sp.id = ue.product_id
      WHERE ue.user_id = auth.uid()
        -- lifecycle access window (grace > current period > legacy expires_at)
        AND (
          COALESCE(ue.grace_period_expires_at, ue.current_period_end, ue.expires_at) IS NULL
          OR COALESCE(ue.grace_period_expires_at, ue.current_period_end, ue.expires_at) > now()
        )
        -- never honor a terminated entitlement
        AND ue.revoked_at IS NULL
        AND COALESCE(ue.status, 'active') NOT IN ('refunded', 'revoked', 'expired')
        -- demo grants only count where demo entitlements are explicitly enabled
        AND (
          ue.source <> 'demo'
          OR COALESCE(current_setting('app.demo_entitlements_enabled', true), 'false') = 'true'
        )
        AND (
          sp.tier = 'plus'
          OR ue.exam_type_id = p_exam_type_id
          OR sp.exam_type_id = p_exam_type_id
        )
    )
  END;
$$;

GRANT EXECUTE ON FUNCTION public.user_has_content_access(UUID) TO authenticated;
