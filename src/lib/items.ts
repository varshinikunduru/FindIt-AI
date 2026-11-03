import { supabase } from '@/lib/supabase';
import type { Category, Claim, Item, ItemKind, NewItemInput } from '@/lib/types';

const PHOTO_BUCKET = 'item-photos';
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_EXTENSIONS: Record<string, string | undefined> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const ITEM_SELECT = '*, reporter:profiles!items_user_id_fkey(display_name)';
const CLAIM_SELECT =
  'id, item_id, claimant_id, proof, status, created_at, responded_at, claimant:profiles!claims_claimant_id_fkey(display_name), item:items!claims_item_id_fkey(id, title, kind, status, user_id, image_path)';

export interface BrowseFilters {
  query: string;
  kind: ItemKind | 'all';
  category: Category | 'all';
}

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export async function fetchBrowseItems(filters: BrowseFilters): Promise<Item[]> {
  let query = supabase
    .from('items')
    .select(ITEM_SELECT)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(200);

  const term = filters.query.trim();
  if (term) {
    query = query.textSearch('search_tsv', term, { type: 'websearch', config: 'english' });
  }
  if (filters.kind !== 'all') {
    query = query.eq('kind', filters.kind);
  }
  if (filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }

  const { data, error } = await query;
  throwIfError(error);
  return (data ?? []) as Item[];
}

export async function fetchItem(id: string): Promise<Item | null> {
  const { data, error } = await supabase
    .from('items')
    .select(ITEM_SELECT)
    .eq('id', id)
    .maybeSingle();
  throwIfError(error);
  return data as Item | null;
}

export async function fetchMyReports(userId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select(ITEM_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  throwIfError(error);
  return (data ?? []) as Item[];
}

export async function fetchPossibleMatches(item: Item, currentUserId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select(ITEM_SELECT)
    .eq('status', 'open')
    .eq('category', item.category)
    .neq('kind', item.kind)
    .neq('user_id', currentUserId)
    .neq('id', item.id)
    .order('created_at', { ascending: false })
    .limit(6);
  throwIfError(error);
  return (data ?? []) as Item[];
}

export async function createItem(input: NewItemInput): Promise<string> {
  const { data, error } = await supabase.from('items').insert(input).select('id').single();
  throwIfError(error);
  return (data as { id: string }).id;
}

export async function uploadItemPhoto(userId: string, file: File): Promise<string> {
  const extension = PHOTO_EXTENSIONS[file.type];
  if (!extension) throw new Error('Photos must be JPG, PNG, or WebP.');
  if (file.size > MAX_PHOTO_BYTES) throw new Error('Photos must be 5 MB or smaller.');

  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: '3600' });
  throwIfError(error);
  return path;
}

export function getItemPhotoUrl(path: string): string {
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function removeItemPhoto(path: string): Promise<void> {
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([path]);
  throwIfError(error);
}

export async function deleteItem(item: Pick<Item, 'id' | 'image_path'>): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', item.id);
  throwIfError(error);
  if (item.image_path) {
    await removeItemPhoto(item.image_path).catch(() => undefined);
  }
}

export async function markItemResolved(itemId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_item_resolved', { p_item_id: itemId });
  throwIfError(error);
}

export async function fetchClaimsForItem(itemId: string): Promise<Claim[]> {
  const { data, error } = await supabase
    .from('claims')
    .select(CLAIM_SELECT)
    .eq('item_id', itemId)
    .order('created_at', { ascending: false });
  throwIfError(error);
  return (data ?? []) as unknown as Claim[];
}

export async function fetchClaimActivity(): Promise<Claim[]> {
  const { data, error } = await supabase
    .from('claims')
    .select(CLAIM_SELECT)
    .order('created_at', { ascending: false })
    .limit(200);
  throwIfError(error);
  return (data ?? []) as unknown as Claim[];
}

export async function createClaim(itemId: string, proof: string): Promise<void> {
  const { error } = await supabase.from('claims').insert({ item_id: itemId, proof }).select('id').single();
  throwIfError(error);
}

export async function withdrawClaim(claimId: string): Promise<void> {
  const { error } = await supabase.from('claims').delete().eq('id', claimId);
  throwIfError(error);
}

export async function respondToClaim(claimId: string, approve: boolean): Promise<void> {
  const { error } = await supabase.rpc('respond_to_claim', {
    p_claim_id: claimId,
    p_approve: approve,
  });
  throwIfError(error);
}
