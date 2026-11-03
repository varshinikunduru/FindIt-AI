/*
# Lost & Found core schema

1. New Tables
- `profiles`: public display name for each signed-in member, created automatically at sign-up.
- `items`: lost or found item reports with category, color, location, date, optional photo path, and status (open, claimed, resolved). Includes a full-text search column.
- `claims`: a member's request to claim an item, with written proof of ownership and a pending/approved/rejected status.

2. Functions and triggers
- `handle_new_user`: trigger that creates a profile when a new account is created.
- `respond_to_claim`: lets only the item's reporter approve or reject a claim. Approving marks the item as claimed and rejects other pending claims for it.
- `mark_item_resolved`: lets only the item's reporter mark their item as resolved.

3. Storage
- Public bucket `item-photos` for item photos. Members can upload and delete only inside their own folder.

4. Security
- RLS enabled on all tables.
- Any signed-in member can browse profiles and items (it is a shared board).
- Items can be created, edited, and deleted only by their reporter. Status changes go through `mark_item_resolved`.
- Claims are visible only to the claimant and the item's reporter. Claims can be created only on open items by someone other than the reporter. Claims are answered only through `respond_to_claim`.
- Function execute rights are revoked from public and anon roles.

5. Important notes
- No existing data is modified or removed.
- Full-text search uses the english configuration across title, description, category, color, and location.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('lost', 'found')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000),
  category text NOT NULL CHECK (category IN ('electronics', 'keys', 'wallet', 'bag', 'clothing', 'jewelry', 'pet', 'documents', 'other')),
  color text NOT NULL DEFAULT '' CHECK (char_length(color) <= 40),
  location_text text NOT NULL CHECK (char_length(location_text) BETWEEN 1 AND 200),
  occurred_on date NOT NULL DEFAULT current_date,
  image_path text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'resolved')),
  search_tsv tsvector GENERATED ALWAYS AS (
    to_tsvector(
      'english'::regconfig,
      coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(category, '') || ' ' || coalesce(color, '') || ' ' || coalesce(location_text, '')
    )
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  claimant_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  proof text NOT NULL CHECK (char_length(proof) BETWEEN 10 AND 1000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT claims_one_per_claimant UNIQUE (item_id, claimant_id)
);

CREATE INDEX IF NOT EXISTS items_search_idx ON items USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS items_browse_idx ON items (status, kind, created_at DESC);
CREATE INDEX IF NOT EXISTS items_user_idx ON items (user_id);
CREATE INDEX IF NOT EXISTS claims_item_idx ON claims (item_id);
CREATE INDEX IF NOT EXISTS claims_claimant_idx ON claims (claimant_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    left(COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), ''), split_part(NEW.email, '@', 1)), 60)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.respond_to_claim(p_claim_id uuid, p_approve boolean)
RETURNS claims
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claim claims%ROWTYPE;
  v_item items%ROWTYPE;
BEGIN
  SELECT * INTO v_claim FROM claims WHERE id = p_claim_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Claim not found';
  END IF;

  SELECT * INTO v_item FROM items WHERE id = v_claim.item_id FOR UPDATE;
  IF v_item.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Only the reporter can respond to this claim';
  END IF;

  IF v_claim.status <> 'pending' THEN
    RAISE EXCEPTION 'This claim has already been answered';
  END IF;

  IF p_approve AND v_item.status <> 'open' THEN
    RAISE EXCEPTION 'This item already has an approved claim';
  END IF;

  UPDATE claims
  SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
      responded_at = now()
  WHERE id = p_claim_id
  RETURNING * INTO v_claim;

  IF p_approve THEN
    UPDATE items SET status = 'claimed' WHERE id = v_item.id;
    UPDATE claims
    SET status = 'rejected', responded_at = now()
    WHERE item_id = v_item.id AND status = 'pending' AND id <> p_claim_id;
  END IF;

  RETURN v_claim;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_item_resolved(p_item_id uuid)
RETURNS items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item items%ROWTYPE;
BEGIN
  UPDATE items
  SET status = 'resolved'
  WHERE id = p_item_id AND user_id = auth.uid() AND status <> 'resolved'
  RETURNING * INTO v_item;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found or already resolved';
  END IF;

  RETURN v_item;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.respond_to_claim(uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_item_resolved(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_to_claim(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_item_resolved(uuid) TO authenticated;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON items TO authenticated;
GRANT UPDATE (kind, title, description, category, color, location_text, occurred_on, image_path) ON items TO authenticated;
GRANT SELECT, INSERT, DELETE ON claims TO authenticated;

DROP POLICY IF EXISTS "profiles_select_members" ON profiles;
CREATE POLICY "profiles_select_members" ON profiles FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "items_select_members" ON items;
CREATE POLICY "items_select_members" ON items FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "items_insert_own" ON items;
CREATE POLICY "items_insert_own" ON items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'open');

DROP POLICY IF EXISTS "items_update_own" ON items;
CREATE POLICY "items_update_own" ON items FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "items_delete_own" ON items;
CREATE POLICY "items_delete_own" ON items FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "claims_select_party" ON claims;
CREATE POLICY "claims_select_party" ON claims FOR SELECT
TO authenticated
USING (
  claimant_id = auth.uid()
  OR EXISTS (SELECT 1 FROM items i WHERE i.id = claims.item_id AND i.user_id = auth.uid())
);

DROP POLICY IF EXISTS "claims_insert_pending" ON claims;
CREATE POLICY "claims_insert_pending" ON claims FOR INSERT
TO authenticated
WITH CHECK (
  claimant_id = auth.uid()
  AND status = 'pending'
  AND EXISTS (
    SELECT 1 FROM items i
    WHERE i.id = claims.item_id AND i.status = 'open' AND i.user_id <> auth.uid()
  )
);

DROP POLICY IF EXISTS "claims_delete_own_pending" ON claims;
CREATE POLICY "claims_delete_own_pending" ON claims FOR DELETE
TO authenticated
USING (claimant_id = auth.uid() AND status = 'pending');

INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "item_photos_insert_own_folder" ON storage.objects;
CREATE POLICY "item_photos_insert_own_folder" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'item-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "item_photos_delete_own_folder" ON storage.objects;
CREATE POLICY "item_photos_delete_own_folder" ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'item-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
