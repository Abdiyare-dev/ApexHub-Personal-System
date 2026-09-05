-- Phase 4: Planner & Journal Tables

-- ==========================================
-- 1. PLANNER ITEMS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.planner_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL, -- 'focus', 'note', 'task', etc.
    content TEXT,
    linked_task_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies for Planner Items
ALTER TABLE public.planner_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own planner items" 
ON public.planner_items FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own planner items" 
ON public.planner_items FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own planner items" 
ON public.planner_items FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own planner items" 
ON public.planner_items FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 2. JOURNAL ENTRIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    content TEXT,
    mood TEXT, -- 'great', 'good', 'neutral', 'low', 'rough'
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_date UNIQUE(user_id, date) -- One entry per day
);

-- RLS Policies for Journal Entries
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own journal entries" 
ON public.journal_entries FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries" 
ON public.journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries" 
ON public.journal_entries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries" 
ON public.journal_entries FOR DELETE USING (auth.uid() = user_id);

-- Create a function to handle updated_at automatically if not exists
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_planner_updated_at ON public.planner_items;
CREATE TRIGGER set_planner_updated_at
BEFORE UPDATE ON public.planner_items
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_journal_updated_at ON public.journal_entries;
CREATE TRIGGER set_journal_updated_at
BEFORE UPDATE ON public.journal_entries
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();
