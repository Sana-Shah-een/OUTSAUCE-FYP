-- Atomically checks and increments lead usage for a billing period.
-- Fixes two bugs in the old TS implementation:
--   1. Silent no-op when no usage row exists for the current period
--      (counter never advanced, limit never enforced).
--   2. Race condition between concurrent bulk-create calls (check and
--      increment were separate round trips, so parallel scraper webhooks
--      could both pass the check before either incremented).
--
-- pg_advisory_xact_lock serializes calls per user_id for the duration of
-- the transaction, so concurrent bulkCreate calls for the same user are
-- processed one at a time. Different users are not blocked by each other.
CREATE OR REPLACE FUNCTION public.check_and_increment_lead_usage(
  p_user_id UUID,
  p_count INT,
  p_limit INT  -- pass -1 for unlimited plans
) RETURNS VOID AS $$
DECLARE
  v_row_id UUID;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_used INT;
BEGIN
  -- Serialize all calls for this user; released automatically at commit.
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));
  SELECT id, period_start, period_end, leads_used
    INTO v_row_id, v_period_start, v_period_end, v_used
  FROM public.usage
  WHERE user_id = p_user_id
    AND period_start <= now()
    AND period_end > now()
  LIMIT 1;
  -- No usage row for the current period: create one instead of silently
  -- allowing unlimited leads through.
  IF v_row_id IS NULL THEN
    v_period_start := now();
    v_period_end := now() + INTERVAL '1 month';
    v_used := 0;
    INSERT INTO public.usage (user_id, period_start, period_end, leads_used)
    VALUES (p_user_id, v_period_start, v_period_end, 0)
    RETURNING id INTO v_row_id;
  END IF;
  IF p_limit <> -1 AND v_used + p_count > p_limit THEN
    RAISE EXCEPTION 'LEAD_LIMIT_EXCEEDED: user % has % of % leads this period', p_user_id, v_used, p_limit
      USING ERRCODE = 'P0001';
  END IF;
  UPDATE public.usage
  SET leads_used = leads_used + p_count
  WHERE id = v_row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
