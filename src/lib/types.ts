export const CATEGORIES = [
  'electronics',
  'keys',
  'wallet',
  'bag',
  'clothing',
  'jewelry',
  'pet',
  'documents',
  'other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  electronics: 'Electronics',
  keys: 'Keys',
  wallet: 'Wallet',
  bag: 'Bags',
  clothing: 'Clothing',
  jewelry: 'Jewelry',
  pet: 'Pets',
  documents: 'Documents',
  other: 'Other',
};

export type ItemKind = 'lost' | 'found';
export type ItemStatus = 'open' | 'claimed' | 'resolved';
export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export interface Item {
  id: string;
  user_id: string;
  kind: ItemKind;
  title: string;
  description: string;
  category: Category;
  color: string;
  location_text: string;
  occurred_on: string;
  image_path: string | null;
  status: ItemStatus;
  created_at: string;
  reporter: { display_name: string } | null;
}

export interface Claim {
  id: string;
  item_id: string;
  claimant_id: string;
  proof: string;
  status: ClaimStatus;
  created_at: string;
  responded_at: string | null;
  claimant: { display_name: string } | null;
  item: {
    id: string;
    title: string;
    kind: ItemKind;
    status: ItemStatus;
    user_id: string;
    image_path: string | null;
  } | null;
}

export interface NewItemInput {
  kind: ItemKind;
  title: string;
  description: string;
  category: Category;
  color: string;
  location_text: string;
  occurred_on: string;
  image_path: string | null;
}
