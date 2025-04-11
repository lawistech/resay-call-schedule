-- Email Accounts Table
CREATE TABLE email_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  provider TEXT NOT NULL, -- gmail, microsoft365, imap, etc.
  provider_settings JSONB, -- Provider-specific settings
  auth_credentials JSONB, -- Encrypted credentials or OAuth tokens
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  sync_status TEXT DEFAULT 'not_synced', -- not_synced, syncing, synced, error
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Folders Table
CREATE TABLE email_folders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider_id TEXT, -- ID used by the email provider
  type TEXT, -- inbox, sent, drafts, trash, spam, custom
  is_system BOOLEAN DEFAULT false, -- System folders cannot be deleted
  parent_id UUID REFERENCES email_folders(id), -- For nested folders
  unread_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Messages Table
CREATE TABLE email_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES email_folders(id) ON DELETE SET NULL,
  thread_id UUID, -- Will be set after thread creation
  provider_id TEXT, -- ID used by the email provider
  message_id TEXT, -- RFC 5322 Message-ID
  in_reply_to TEXT, -- RFC 5322 In-Reply-To
  references TEXT[], -- RFC 5322 References
  from_address TEXT NOT NULL,
  from_name TEXT,
  to_addresses TEXT[] NOT NULL,
  cc_addresses TEXT[],
  bcc_addresses TEXT[],
  subject TEXT,
  html_body TEXT,
  plain_body TEXT,
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  has_attachments BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Threads Table
CREATE TABLE email_threads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  subject TEXT,
  snippet TEXT, -- Short preview of the latest message
  participants TEXT[], -- All email addresses involved
  message_count INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,
  is_starred BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  has_attachments BOOLEAN DEFAULT false,
  latest_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Attachments Table
CREATE TABLE email_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES email_messages(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content_type TEXT,
  size INTEGER,
  content_id TEXT, -- For inline attachments
  storage_path TEXT, -- Path in storage bucket
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Labels Table (for Gmail-style labels)
CREATE TABLE email_labels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  provider_id TEXT, -- ID used by the email provider
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Message Labels Junction Table
CREATE TABLE email_message_labels (
  message_id UUID REFERENCES email_messages(id) ON DELETE CASCADE,
  label_id UUID REFERENCES email_labels(id) ON DELETE CASCADE,
  PRIMARY KEY (message_id, label_id)
);

-- Email Access Table (for team collaboration)
CREATE TABLE email_access (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL, -- read, write, admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (account_id, user_id)
);

-- Email Filters Table
CREATE TABLE email_filters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  conditions JSONB NOT NULL, -- Filter conditions
  actions JSONB NOT NULL, -- Actions to take when conditions match
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS on tables
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_message_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_filters ENABLE ROW LEVEL SECURITY;

-- Email Accounts policies
CREATE POLICY "Users can view their own email accounts" 
  ON email_accounts FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM email_access 
    WHERE email_access.account_id = email_accounts.id 
    AND email_access.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own email accounts" 
  ON email_accounts FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own email accounts" 
  ON email_accounts FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own email accounts" 
  ON email_accounts FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Similar policies for other tables...
