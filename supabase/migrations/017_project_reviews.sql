-- ============================================
-- v0.3A: AI 리뷰 + 대화
-- ============================================

CREATE TYPE review_type AS ENUM ('weekly', 'monthly', 'on_demand');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE project_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  review_type review_type DEFAULT 'on_demand',
  generated_by text DEFAULT 'gemini-2.0-flash',
  summary text,
  report_content jsonb DEFAULT '{}',
  risk_level risk_level DEFAULT 'low',
  recommendations jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_reviews_project ON project_reviews(project_id);

CREATE TABLE project_review_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  messages jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE project_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_review_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select" ON project_reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "reviews_insert" ON project_reviews
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "convs_select" ON project_review_conversations
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "convs_insert" ON project_review_conversations
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "convs_update" ON project_review_conversations
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
