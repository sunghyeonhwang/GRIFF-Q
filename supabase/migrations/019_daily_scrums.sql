-- ============================================
-- v0.3C: 데일리 스크럼 시스템
-- ============================================

-- 1. daily_scrums 테이블
CREATE TABLE IF NOT EXISTS daily_scrums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  scrum_date date NOT NULL,
  status text NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'brainstorming', 'prioritizing', 'scheduling', 'completed', 'skipped')),
  skip_reason text,
  ai_conversation jsonb DEFAULT '[]',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, scrum_date)
);

CREATE INDEX IF NOT EXISTS idx_scrums_user_date ON daily_scrums(user_id, scrum_date);

ALTER TABLE daily_scrums ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_scrums' AND policyname = 'scrums_select') THEN
    CREATE POLICY "scrums_select" ON daily_scrums FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super', 'boss', 'manager')));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_scrums' AND policyname = 'scrums_insert') THEN
    CREATE POLICY "scrums_insert" ON daily_scrums FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_scrums' AND policyname = 'scrums_update') THEN
    CREATE POLICY "scrums_update" ON daily_scrums FOR UPDATE TO authenticated
      USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_scrums' AND policyname = 'scrums_delete') THEN
    CREATE POLICY "scrums_delete" ON daily_scrums FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- updated_at 트리거
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_daily_scrums_updated_at') THEN
    CREATE TRIGGER set_daily_scrums_updated_at
      BEFORE UPDATE ON daily_scrums
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- 2. scrum_items 테이블
CREATE TABLE IF NOT EXISTS scrum_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scrum_id uuid NOT NULL REFERENCES daily_scrums(id) ON DELETE CASCADE,
  title text NOT NULL,
  priority text DEFAULT 'normal'
    CHECK (priority IN ('urgent', 'important', 'normal', 'later')),
  priority_order integer DEFAULT 0,
  time_block_start time,
  time_block_end time,
  estimated_minutes integer DEFAULT 30,
  is_carried_over boolean DEFAULT false,
  source_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  generated_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  status text DEFAULT 'planned'
    CHECK (status IN ('planned', 'completed', 'skipped')),
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scrum_items_scrum ON scrum_items(scrum_id);

ALTER TABLE scrum_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scrum_items' AND policyname = 'scrum_items_select') THEN
    CREATE POLICY "scrum_items_select" ON scrum_items FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM daily_scrums WHERE id = scrum_id AND (
          user_id = auth.uid() OR
          EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super', 'boss', 'manager'))
        )
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scrum_items' AND policyname = 'scrum_items_insert') THEN
    CREATE POLICY "scrum_items_insert" ON scrum_items FOR INSERT TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM daily_scrums WHERE id = scrum_id AND user_id = auth.uid()
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scrum_items' AND policyname = 'scrum_items_update') THEN
    CREATE POLICY "scrum_items_update" ON scrum_items FOR UPDATE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM daily_scrums WHERE id = scrum_id AND user_id = auth.uid()
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scrum_items' AND policyname = 'scrum_items_delete') THEN
    CREATE POLICY "scrum_items_delete" ON scrum_items FOR DELETE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM daily_scrums WHERE id = scrum_id AND user_id = auth.uid()
      ));
  END IF;
END $$;
