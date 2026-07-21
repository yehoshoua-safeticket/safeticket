export type UserRole = 'external_user' | 'internal_user' | 'admin';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type ListingStatus = 'draft' | 'pending_review' | 'active' | 'sold' | 'rejected' | 'expired';
export type RiskStatus = 'clear' | 'flagged' | 'under_review' | 'blocked';
export type PaymentStatus = 'pending' | 'paid' | 'held' | 'released' | 'refunded' | 'failed';
export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'disputed';
export type PayoutStatus = 'pending' | 'held' | 'pending_release' | 'released' | 'cancelled';
export type DisputeStatus = 'open' | 'under_review' | 'resolved_buyer' | 'resolved_seller' | 'closed';
export type EventCategory = 'concert' | 'sports' | 'theater' | 'festival' | 'conference' | 'other';
export type EventStatus = 'pending_review' | 'active' | 'rejected';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  verification_status: VerificationStatus;
  avatar_url: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  venue: string;
  city: string;
  event_date: string;
  category: EventCategory;
  image_url: string | null;
  status?: EventStatus; // optional until the add-event-status migration is applied
  created_at: string;
}

// Homepage curation (add-homepage-curation.sql). Both degrade gracefully:
// a missing table just yields an empty result, so the homepage hides the section.
export interface FeaturedEvent {
  event_id: string;
  position: number;
  created_at: string;
  event?: Event; // joined in the admin GET
}

export interface CategoryCover {
  category: EventCategory;
  event_id: string;
  updated_at: string;
  event?: Event; // joined in the admin GET
}

export type FaqCategory = 'general' | 'buyers' | 'sellers' | 'security';

// FAQ entries shown on the How-it-works page (add-faqs.sql). Hebrew is the
// source of truth; the *_en fields fall back to it when left blank.
export interface Faq {
  id: string;
  question_he: string;
  answer_he: string;
  question_en: string;
  answer_en: string;
  asterisk_he: string; // optional footnote under the answer
  asterisk_en: string;
  keywords: string;    // free text, matched by search alongside question/answer
  category: FaqCategory | null;
  position: number;    // display order, low to high
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  event_id: string;
  section: string | null;
  row: string | null;
  seat_info: string | null;
  quantity: number;
  face_value: number;
  asking_price: number;
  currency: string;
  status: ListingStatus;
  ticket_file_url: string | null;
  risk_status: RiskStatus;
  created_at: string;
  event?: Event;
  seller?: Profile;
}

export interface Order {
  id: string;
  buyer_id: string;
  listing_id: string;
  total_amount: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  payout_status: PayoutStatus;
  created_at: string;
  listing?: Listing;
  buyer?: Profile;
}

export interface Dispute {
  id: string;
  order_id: string;
  opened_by: string;
  reason: string;
  status: DisputeStatus;
  admin_resolution: string | null;
  created_at: string;
  order?: Order;
}

export interface Payout {
  id: string;
  order_id: string;
  seller_id: string;
  amount: number;
  status: PayoutStatus;
  released_at: string | null;
  created_at: string;
}

export interface Verification {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string | null;
  status: VerificationStatus;
  reviewed_at: string | null;
  created_at: string;
}

export interface AdminNote {
  id: string;
  target_type: 'user' | 'listing' | 'order' | 'dispute';
  target_id: string;
  author_id: string;
  note: string;
  created_at: string;
}

export type TaskStatus = 'todo' | 'done' | 'canceled';
export type TaskSection = 'storefront' | 'user_space' | 'backoffice';

export interface TaskFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface EmployeeTask {
  id: string;
  name: string;
  description: string;
  assigned_to: string | null;
  created_by: string | null;
  status: TaskStatus;
  section: TaskSection | null;
  page: string | null;
  device: 'not_relevant' | 'mobile' | 'tablet' | 'computer' | null;
  active: boolean;
  files: TaskFile[];
  created_at: string;
  assignee: { id: string; full_name: string } | null;
  creator: { id: string; full_name: string } | null;
}
