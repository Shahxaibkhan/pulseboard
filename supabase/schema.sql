-- PulseBoard Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'VIEWER' CHECK (role IN ('ADMIN', 'PM', 'TEAM_MEMBER', 'VIEWER')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'ON_HOLD')),
  owner_id UUID REFERENCES public.app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SOPs
CREATE TABLE IF NOT EXISTS public.sops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  readiness INTEGER NOT NULL DEFAULT 0 CHECK (readiness >= 0 AND readiness <= 100),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SOP Subtasks
CREATE TABLE IF NOT EXISTS public.sop_subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sop_id UUID NOT NULL REFERENCES public.sops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  department TEXT,
  assigned_to UUID REFERENCES public.app_users(id),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
  depends_on UUID REFERENCES public.sop_subtasks(id),
  remarks TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automations
CREATE TABLE IF NOT EXISTS public.automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Phases
CREATE TABLE IF NOT EXISTS public.automation_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('VENDOR', 'DEVELOPMENT', 'SIT', 'UAT', 'GO_LIVE')),
  owner TEXT,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Releases
CREATE TABLE IF NOT EXISTS public.releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  release_date DATE,
  status TEXT NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED')),
  vendor_name TEXT,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Release Items
CREATE TABLE IF NOT EXISTS public.release_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  release_id UUID NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'FEATURE' CHECK (type IN ('FEATURE', 'BUG', 'IMPROVEMENT')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'DONE')),
  owner TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('TASK_ASSIGNED', 'TASK_DELAYED', 'DEPENDENCY_BLOCKED', 'RELEASE_UPCOMING')),
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  entity_id UUID,
  entity_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data (app-level RBAC handles write access)
CREATE POLICY "Authenticated users can read app_users" ON public.app_users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.app_users
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Authenticated users can read projects" ON public.projects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage projects" ON public.projects
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can read sops" ON public.sops
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage sops" ON public.sops
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can read subtasks" ON public.sop_subtasks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage subtasks" ON public.sop_subtasks
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can read automations" ON public.automations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage automations" ON public.automations
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can read automation phases" ON public.automation_phases
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage automation phases" ON public.automation_phases
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can read releases" ON public.releases
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage releases" ON public.releases
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can read release items" ON public.release_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage release items" ON public.release_items
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Auto-create app_user on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.app_users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'VIEWER')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
