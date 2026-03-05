export type ProductMedia = {
  file_url: string;
  media_type: string;
  is_primary: boolean;
};

export type ProductItem = {
  id: string;
  title: string;
  slug: string;
  price: number;
  status: 'draft' | 'published' | 'archived' | string;
  ai_generated_metadata?: {
    description?: string;
    features?: string[];
  };
  created_at: string;
  published_at?: string | null;
  product_media?: ProductMedia[];
};

export type OnboardingStatus = {
  has_tenant: boolean;
  has_social_account: boolean;
  has_sync_state: boolean;
  token_valid: boolean;
  automation_ready: boolean;
  active_social_account?: {
    id: string;
    platform_account_id: string;
    platform_username?: string | null;
    token_expires_at?: string | null;
  } | null;
};

export type OauthCandidate = {
  page_id: string;
  page_name: string;
  platform_account_id: string;
  platform_username?: string | null;
};

export type PendingOauthSession = {
  status: 'pending_selection';
  session_id: string;
  candidates: OauthCandidate[];
  expires_at: string;
};

export type BootstrapPayload = {
  user: {
    id: string;
    email: string | null;
  };
  tenant: {
    id: string;
    name: string;
  } | null;
  onboarding_status: OnboardingStatus;
  recent_products: ProductItem[];
  automation_ready: boolean;
};
