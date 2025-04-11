-- Email Templates Table
CREATE TABLE email_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  plain_content TEXT,
  category TEXT,
  tags TEXT[],
  variables TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Campaigns Table
CREATE TABLE email_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_id UUID REFERENCES email_templates(id),
  status TEXT DEFAULT 'draft', -- draft, scheduled, in_progress, completed, cancelled
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  target_audience JSONB, -- Criteria for selecting recipients
  a_b_test_enabled BOOLEAN DEFAULT false,
  a_b_test_data JSONB, -- A/B test configuration
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Recipients Table
CREATE TABLE email_recipients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, sent, delivered, opened, clicked, bounced, unsubscribed
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  a_b_variant TEXT, -- 'A' or 'B' for A/B testing
  custom_variables JSONB, -- Personalized variables for this recipient
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Tracking Events Table
CREATE TABLE email_tracking_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipient_id UUID REFERENCES email_recipients(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- open, click, bounce, unsubscribe
  event_data JSONB, -- Additional data about the event (e.g., link clicked, bounce reason)
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Signatures Table
CREATE TABLE email_signatures (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Sequences Table
CREATE TABLE email_sequences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT, -- new_contact, status_change, deal_stage, manual
  trigger_data JSONB, -- Configuration for the trigger
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Sequence Steps Table
CREATE TABLE email_sequence_steps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id),
  step_order INTEGER NOT NULL,
  delay_days INTEGER DEFAULT 0,
  delay_hours INTEGER DEFAULT 0,
  condition TEXT, -- Optional condition for sending this step
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact Email Preferences Table
CREATE TABLE contact_email_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  subscribed BOOLEAN DEFAULT true,
  unsubscribe_reason TEXT,
  email_frequency TEXT DEFAULT 'normal', -- low, normal, high
  preferred_content TEXT[], -- Types of content the contact prefers
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS on tables
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_email_preferences ENABLE ROW LEVEL SECURITY;

-- Email Templates policy
CREATE POLICY "Users can view all email templates" 
  ON email_templates FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can insert email templates" 
  ON email_templates FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Users can update email templates" 
  ON email_templates FOR UPDATE 
  TO authenticated 
  USING (true);

-- Email Campaigns policy
CREATE POLICY "Users can view all email campaigns" 
  ON email_campaigns FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can insert email campaigns" 
  ON email_campaigns FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Users can update email campaigns" 
  ON email_campaigns FOR UPDATE 
  TO authenticated 
  USING (true);

-- Add triggers for updated_at timestamps
CREATE TRIGGER set_timestamp_email_templates
BEFORE UPDATE ON email_templates
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER set_timestamp_email_campaigns
BEFORE UPDATE ON email_campaigns
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER set_timestamp_email_signatures
BEFORE UPDATE ON email_signatures
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER set_timestamp_email_sequences
BEFORE UPDATE ON email_sequences
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER set_timestamp_email_sequence_steps
BEFORE UPDATE ON email_sequence_steps
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
