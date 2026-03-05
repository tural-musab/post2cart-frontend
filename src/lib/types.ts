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

export type AutomationExecution = {
  id: string;
  workflow_name: string;
  external_execution_id: string;
  status: 'started' | 'success' | 'failed' | string;
  node_name?: string | null;
  error_reason?: string | null;
  meta?: Record<string, unknown> | null;
  started_at: string;
  finished_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type AutomationFailedItem = {
  id: string;
  workflow_name: string;
  node_name?: string | null;
  error_reason: string;
  retry_count: number;
  status: 'pending' | 'resolved' | 'ignored' | string;
  created_at: string;
  updated_at: string;
  last_retry_at?: string | null;
  last_retry_job_id?: string | null;
  payload?: Record<string, unknown>;
  retryable: boolean;
  retry_context?: Record<string, unknown> | null;
};

export type AutomationOpsPayload = {
  tenant: {
    id: string;
    name: string;
  } | null;
  summary: {
    pending_failed_count: number;
    queued_retry_count: number;
    processing_retry_count: number;
    success_last_24h: number;
    failed_last_24h: number;
    last_execution: AutomationExecution | null;
  };
  recent_executions: AutomationExecution[];
  failed_items: AutomationFailedItem[];
};

export type AutomationExecutionsResponse = {
  items: AutomationExecution[];
  next_cursor: string | null;
};

export type AutomationFailedItemsResponse = {
  items: AutomationFailedItem[];
  next_cursor: string | null;
};
