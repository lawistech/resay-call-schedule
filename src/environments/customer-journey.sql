-- Customer Journey Tables

-- Customer Journeys Table
CREATE TABLE IF NOT EXISTS customer_journeys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  current_stage TEXT NOT NULL,
  stages JSONB NOT NULL, -- Array of journey stages
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  total_touchpoints INTEGER DEFAULT 0,
  journey_score NUMERIC(5, 2), -- Overall score/health of the journey (0-100)
  bottlenecks TEXT[], -- Identified bottlenecks in the journey
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Touchpoints Table
CREATE TABLE IF NOT EXISTS customer_touchpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id UUID REFERENCES customer_journeys(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- email, call, meeting, quote, order, website, other
  subtype TEXT, -- e.g., marketing_email, sales_call, etc.
  channel TEXT NOT NULL, -- phone, email, in_person, web, social, other
  source_id UUID, -- ID of the source record (call ID, email ID, etc.)
  source_type TEXT, -- Type of the source record (calls, emails, etc.)
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  outcome TEXT, -- positive, neutral, negative
  notes TEXT,
  metadata JSONB, -- Additional data specific to the touchpoint type
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journey Stage Definitions Table (for predefined stages)
CREATE TABLE IF NOT EXISTS journey_stage_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  order_num INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default journey stages
INSERT INTO journey_stage_definitions (name, description, order_num)
VALUES
  ('Lead', 'Initial contact or lead generation', 1),
  ('Qualified Lead', 'Lead has been qualified', 2),
  ('Opportunity', 'Qualified lead has become an opportunity', 3),
  ('Proposal', 'Proposal has been sent', 4),
  ('Negotiation', 'Negotiating terms', 5),
  ('Closed Won', 'Deal has been closed', 6),
  ('Customer', 'Active customer', 7),
  ('Loyal Customer', 'Repeat business or referrals', 8);

-- Journey Analytics View
CREATE OR REPLACE VIEW journey_analytics AS
WITH journey_metrics AS (
  SELECT
    j.id,
    j.customer_id,
    j.company_id,
    j.current_stage,
    j.start_date,
    j.last_updated,
    j.is_active,
    j.total_touchpoints,
    EXTRACT(DAY FROM (COALESCE(j.last_updated, NOW()) - j.start_date)) AS journey_duration_days,
    COUNT(t.id) AS actual_touchpoints,
    COUNT(CASE WHEN t.outcome = 'positive' THEN 1 END) AS positive_touchpoints,
    COUNT(CASE WHEN t.outcome = 'negative' THEN 1 END) AS negative_touchpoints
  FROM
    customer_journeys j
    LEFT JOIN customer_touchpoints t ON j.id = t.journey_id
  GROUP BY
    j.id
)
SELECT
  id,
  customer_id,
  company_id,
  current_stage,
  start_date,
  last_updated,
  is_active,
  journey_duration_days,
  actual_touchpoints,
  positive_touchpoints,
  negative_touchpoints,
  CASE
    WHEN actual_touchpoints > 0 THEN (positive_touchpoints::float / actual_touchpoints) * 100
    ELSE 0
  END AS positive_touchpoint_percentage,
  CASE
    WHEN journey_duration_days > 0 THEN actual_touchpoints::float / journey_duration_days
    ELSE 0
  END AS touchpoints_per_day
FROM
  journey_metrics;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_touchpoints_journey_id ON customer_touchpoints(journey_id);
CREATE INDEX IF NOT EXISTS idx_customer_touchpoints_customer_id ON customer_touchpoints(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_touchpoints_timestamp ON customer_touchpoints(timestamp);
CREATE INDEX IF NOT EXISTS idx_customer_journeys_customer_id ON customer_journeys(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_journeys_company_id ON customer_journeys(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_journeys_current_stage ON customer_journeys(current_stage);

-- Create RLS policies
ALTER TABLE customer_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_stage_definitions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can read all customer journeys"
  ON customer_journeys FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert customer journeys"
  ON customer_journeys FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update customer journeys"
  ON customer_journeys FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read all customer touchpoints"
  ON customer_touchpoints FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert customer touchpoints"
  ON customer_touchpoints FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update customer touchpoints"
  ON customer_touchpoints FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read all journey stage definitions"
  ON journey_stage_definitions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create functions for journey analytics
CREATE OR REPLACE FUNCTION get_journey_conversion_rates()
RETURNS TABLE (
  from_stage TEXT,
  to_stage TEXT,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH stage_transitions AS (
    SELECT
      t1.journey_id,
      t1.metadata->>'stageId' AS from_stage,
      t2.metadata->>'stageId' AS to_stage,
      t1.timestamp AS from_timestamp,
      t2.timestamp AS to_timestamp
    FROM
      customer_touchpoints t1
      JOIN customer_touchpoints t2 ON t1.journey_id = t2.journey_id
    WHERE
      t1.metadata->>'stageId' IS NOT NULL
      AND t2.metadata->>'stageId' IS NOT NULL
      AND t1.metadata->>'stageId' != t2.metadata->>'stageId'
      AND t1.timestamp < t2.timestamp
      AND NOT EXISTS (
        SELECT 1
        FROM customer_touchpoints t3
        WHERE
          t3.journey_id = t1.journey_id
          AND t3.metadata->>'stageId' IS NOT NULL
          AND t3.timestamp > t1.timestamp
          AND t3.timestamp < t2.timestamp
      )
  ),
  stage_counts AS (
    SELECT
      from_stage,
      COUNT(DISTINCT journey_id) AS total_journeys
    FROM
      stage_transitions
    GROUP BY
      from_stage
  ),
  transition_counts AS (
    SELECT
      from_stage,
      to_stage,
      COUNT(DISTINCT journey_id) AS transition_count
    FROM
      stage_transitions
    GROUP BY
      from_stage, to_stage
  )
  SELECT
    tc.from_stage,
    tc.to_stage,
    ROUND((tc.transition_count::NUMERIC / sc.total_journeys) * 100, 2) AS conversion_rate
  FROM
    transition_counts tc
    JOIN stage_counts sc ON tc.from_stage = sc.from_stage
  ORDER BY
    tc.from_stage, tc.to_stage;
END;
$$ LANGUAGE plpgsql;
