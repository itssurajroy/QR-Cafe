-- Copyright (c) 2026 QRslice. All rights reserved.
-- Phase 8: atomic loyalty RPCs (A12) + p_count_visit (B3)
--
-- Fixes race conditions in read-modify-write loyalty flows:
-- concurrent settle/redeem/refund previously lost balance updates.
-- reverseCustomerLoyalty compensation sign: reverse ledger entry is
-- always -abs(earn.points); balance moves by that signed amount
-- (GREATEST(0, balance + compensation)) so refund cannot mint points.

CREATE UNIQUE INDEX IF NOT EXISTS restaurant_customers_restaurant_phone_uniq
  ON public.restaurant_customers (restaurant_id, phone);

-- One earn / one reverse per order (idempotent double-settle / double-refund)
CREATE UNIQUE INDEX IF NOT EXISTS loyalty_transactions_order_type_uniq
  ON public.loyalty_transactions (order_id, type)
  WHERE order_id IS NOT NULL AND type IN ('earn', 'reverse');

-- B3: atomically count a visit (create customer row if missing)
CREATE OR REPLACE FUNCTION public.p_count_visit(
  p_restaurant_id uuid,
  p_phone text,
  p_name text DEFAULT ''
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_restaurant_customers%ROWTYPE;
  v_new_visits int;
BEGIN
  IF p_restaurant_id IS NULL OR p_phone IS NULL OR btrim(p_phone) = '' THEN
    RAISE EXCEPTION 'restaurant_id and phone are required';
  END IF;

  SELECT * INTO v_row FROM restaurant_customers
  WHERE restaurant_id = p_restaurant_id AND phone = p_phone
  FOR UPDATE;

  IF FOUND THEN
    v_new_visits := COALESCE(v_row.visit_count, 0) + 1;
    UPDATE restaurant_customers
    SET visit_count = v_new_visits,
        last_visit_at = now(),
        name = COALESCE(NULLIF(btrim(p_name), ''), name)
    WHERE id = v_row.id;
    v_row.visit_count := v_new_visits;
    v_row.last_visit_at := now();
  ELSE
    INSERT INTO restaurant_customers (restaurant_id, phone, name, visit_count, last_visit_at, loyalty_points, total_spent_paise)
    VALUES (p_restaurant_id, p_phone, COALESCE(NULLIF(btrim(p_name), ''), ''), 1, now(), 0, 0)
    ON CONFLICT (restaurant_id, phone) DO UPDATE
      SET visit_count = COALESCE(restaurant_customers.visit_count, 0) + 1,
          last_visit_at = now()
    RETURNING * INTO v_row;
  END IF;

  RETURN jsonb_build_object(
    'customerId', v_row.id,
    'visitCount', COALESCE(v_row.visit_count, 0),
    'lastVisitAt', v_row.last_visit_at
  );
END;
$$;

-- A12: atomic earn (points + spend + visit + ledger) under row lock
CREATE OR REPLACE FUNCTION public.p_earn_loyalty(
  p_restaurant_id uuid,
  p_phone text,
  p_name text DEFAULT '',
  p_total_paise bigint DEFAULT 0,
  p_order_id uuid DEFAULT NULL,
  p_order_number text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row restaurant_customers%ROWTYPE;
  v_points int;
  v_new_balance int;
  v_new_spent bigint;
  v_already jsonb;
BEGIN
  IF p_restaurant_id IS NULL OR p_phone IS NULL OR btrim(p_phone) = '' THEN
    RAISE EXCEPTION 'restaurant_id and phone are required';
  END IF;
  IF p_total_paise IS NULL OR p_total_paise < 0 THEN
    RAISE EXCEPTION 'total_paise must be >= 0';
  END IF;

  -- Idempotent: same order cannot earn twice (unique order_id+type=earn)
  IF p_order_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM loyalty_transactions
    WHERE order_id = p_order_id AND type = 'earn'
  ) THEN
    SELECT * INTO v_row FROM restaurant_customers
    WHERE restaurant_id = p_restaurant_id AND phone = p_phone
    FOR UPDATE;
    RETURN jsonb_build_object(
      'pointsEarned', 0,
      'newTotalPoints', COALESCE(v_row.loyalty_points, 0),
      'customerId', v_row.id,
      'already', true
    );
  END IF;

  -- 1 point per ₹100 spent (10,000 paise)
  v_points := floor(p_total_paise / 10000.0)::int;

  SELECT * INTO v_row FROM restaurant_customers
  WHERE restaurant_id = p_restaurant_id AND phone = p_phone
  FOR UPDATE;

  IF FOUND THEN
    v_new_balance := COALESCE(v_row.loyalty_points, 0) + v_points;
    v_new_spent := COALESCE(v_row.total_spent_paise, 0) + p_total_paise;
    UPDATE restaurant_customers
    SET name = COALESCE(NULLIF(btrim(p_name), ''), name),
        total_spent_paise = v_new_spent,
        loyalty_points = v_new_balance,
        visit_count = COALESCE(visit_count, 0) + 1,
        last_visit_at = now()
    WHERE id = v_row.id
    RETURNING * INTO v_row;
  ELSE
    v_new_balance := v_points;
    INSERT INTO restaurant_customers (restaurant_id, phone, name, loyalty_points, total_spent_paise, visit_count, last_visit_at)
    VALUES (p_restaurant_id, p_phone, COALESCE(NULLIF(btrim(p_name), ''), ''), v_new_balance, COALESCE(p_total_paise, 0), 1, now())
    ON CONFLICT (restaurant_id, phone) DO UPDATE
      SET name = COALESCE(NULLIF(btrim(p_name), ''), restaurant_customers.name),
          total_spent_paise = COALESCE(restaurant_customers.total_spent_paise, 0) + COALESCE(p_total_paise, 0),
          loyalty_points = COALESCE(restaurant_customers.loyalty_points, 0),
          visit_count = COALESCE(restaurant_customers.visit_count, 0) + 1,
          last_visit_at = now()
    RETURNING * INTO v_row;

    -- After upsert, re-read under lock with earn applied to final balance
    SELECT * INTO v_row FROM restaurant_customers
    WHERE restaurant_id = p_restaurant_id AND phone = p_phone
    FOR UPDATE;
    v_new_balance := COALESCE(v_row.loyalty_points, 0) + v_points;
    UPDATE restaurant_customers SET loyalty_points = v_new_balance
    WHERE id = v_row.id
    RETURNING * INTO v_row;
  END IF;

  IF v_points > 0 AND v_row.id IS NOT NULL THEN
    INSERT INTO loyalty_transactions (restaurant_id, customer_id, order_id, points, balance_after, type, notes)
    VALUES (
      p_restaurant_id,
      v_row.id,
      p_order_id,
      v_points,
      v_new_balance,
      'earn',
      CASE
        WHEN p_order_number IS NOT NULL AND btrim(p_order_number) <> ''
          THEN 'Earned on order #' || btrim(p_order_number)
        ELSE 'Points earned from dine-in payment'
      END
    );
  END IF;

  RETURN jsonb_build_object(
    'pointsEarned', v_points,
    'newTotalPoints', v_new_balance,
    'customerId', v_row.id,
    'visitCount', COALESCE(v_row.visit_count, 0),
    'already', false
  );
END;
$$;

-- A12: atomic redeem under row lock (throws if insufficient)
CREATE OR REPLACE FUNCTION public.p_redeem_loyalty(
  p_restaurant_id uuid,
  p_phone text,
  p_points int,
  p_order_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row restaurant_customers%ROWTYPE;
  v_new_balance int;
  v_requested int;
BEGIN
  IF p_restaurant_id IS NULL OR p_phone IS NULL OR btrim(p_phone) = '' THEN
    RAISE EXCEPTION 'restaurant_id and phone are required';
  END IF;
  IF p_points IS NULL OR p_points <= 0 THEN
    RAISE EXCEPTION 'points must be > 0';
  END IF;

  v_requested := p_points;

  SELECT * INTO v_row FROM restaurant_customers
  WHERE restaurant_id = p_restaurant_id AND phone = p_phone
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient loyalty points';
  END IF;
  IF COALESCE(v_row.loyalty_points, 0) < v_requested THEN
    RAISE EXCEPTION 'Insufficient loyalty points';
  END IF;

  v_new_balance := v_row.loyalty_points - v_requested;

  UPDATE restaurant_customers
  SET loyalty_points = v_new_balance
  WHERE id = v_row.id;

  INSERT INTO loyalty_transactions (restaurant_id, customer_id, order_id, points, balance_after, type, notes)
  VALUES (
    p_restaurant_id,
    v_row.id,
    p_order_id,
    -v_requested,
    v_new_balance,
    'redeem',
    CASE
      WHEN p_order_id IS NOT NULL THEN 'Redeemed on order ' || p_order_id::text
      ELSE 'Points redeemed against bill'
    END
  );

  INSERT INTO audit_events (restaurant_id, entity, entity_id, action, metadata)
  VALUES (
    p_restaurant_id,
    'customer_points',
    v_row.id,
    'points_redeemed',
    jsonb_build_object(
      'adjustment', -v_requested,
      'previous_balance', v_row.loyalty_points,
      'new_balance', v_new_balance,
      'order_id', p_order_id,
      'reason', 'Redeemed on order'
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'newPoints', v_new_balance,
    'customerId', v_row.id
  );
END;
$$;

-- A12: atomic reverse of earn (and restore any redeem) for refund/cancel.
-- Compensation sign: reverse ledger points = -abs(earn.points) (never mint).
CREATE OR REPLACE FUNCTION public.p_reverse_loyalty(
  p_restaurant_id uuid,
  p_order_id uuid,
  p_reason text DEFAULT 'Order refund'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx record;
  v_row restaurant_customers%ROWTYPE;
  v_compensation int;
  v_new_balance int;
  v_reversed_earn int := 0;
  v_restored_redeem int := 0;
BEGIN
  IF p_restaurant_id IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'restaurant_id and order_id are required';
  END IF;

  -- Already reversed?
  IF EXISTS (
    SELECT 1 FROM loyalty_transactions
    WHERE order_id = p_order_id AND type = 'reverse'
  ) THEN
    RETURN jsonb_build_object('reversed', 0, 'already', true);
  END IF;

  FOR v_tx IN
    SELECT id, customer_id, points, type
    FROM loyalty_transactions
    WHERE restaurant_id = p_restaurant_id
      AND order_id = p_order_id
      AND type IN ('earn', 'redeem')
    ORDER BY type, id
    FOR UPDATE
  LOOP
    SELECT * INTO v_row FROM restaurant_customers
    WHERE id = v_tx.customer_id
    FOR UPDATE;
    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    IF v_tx.type = 'earn' THEN
      -- Reverse only positive earns; compensation is always negative
      IF v_tx.points <= 0 THEN
        CONTINUE;
      END IF;
      v_compensation := -abs(v_tx.points);
      v_new_balance := GREATEST(0, COALESCE(v_row.loyalty_points, 0) + v_compensation);

      UPDATE restaurant_customers
      SET loyalty_points = v_new_balance
      WHERE id = v_row.id;

      INSERT INTO loyalty_transactions (restaurant_id, customer_id, order_id, points, balance_after, type, notes)
      VALUES (
        p_restaurant_id,
        v_row.id,
        p_order_id,
        v_compensation,
        v_new_balance,
        'reverse',
        format('Reversal: %s (Order %s)', p_reason, p_order_id)
      );
      v_reversed_earn := v_reversed_earn + 1;
    ELSIF v_tx.type = 'redeem' AND v_tx.points < 0 THEN
      -- Refund restores redeemed points: compensation is positive abs(redeem)
      v_compensation := abs(v_tx.points);
      v_new_balance := COALESCE(v_row.loyalty_points, 0) + v_compensation;

      UPDATE restaurant_customers
      SET loyalty_points = v_new_balance
      WHERE id = v_row.id;

      INSERT INTO loyalty_transactions (restaurant_id, customer_id, order_id, points, balance_after, type, notes)
      VALUES (
        p_restaurant_id,
        v_row.id,
        p_order_id,
        v_compensation,
        v_new_balance,
        'redeem_reverse',
        format('Redeem restored: %s (Order %s)', p_reason, p_order_id)
      );
      v_restored_redeem := v_restored_redeem + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'reversed', v_reversed_earn,
    'restoredRedeems', v_restored_redeem,
    'already', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.p_count_visit(uuid, text, text) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.p_earn_loyalty(uuid, text, text, bigint, uuid, text) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.p_redeem_loyalty(uuid, text, int, uuid) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.p_reverse_loyalty(uuid, uuid, text) TO service_role, authenticated;

COMMENT ON FUNCTION public.p_earn_loyalty(uuid, text, text, bigint, uuid, text) IS 'Atomic loyalty earn (A12): row-locked balance/spend/visit + ledger insert; idempotent per order_id';
COMMENT ON FUNCTION public.p_redeem_loyalty(uuid, text, int, uuid) IS 'Atomic loyalty redeem (A12): row-locked debit + ledger + audit';
COMMENT ON FUNCTION public.p_reverse_loyalty(uuid, uuid, text) IS 'Atomic reverse (A12): compensation sign is -abs(earn) so refunds cannot mint points; also restores redeem';
COMMENT ON FUNCTION public.p_count_visit(uuid, text, text) IS 'Atomic visit counter (B3): increments visit_count and last_visit_at under row lock';

NOTIFY pgrst, 'reload schema';
