-- ==============================================================================
-- ArchXperience Phase 6 — Normalized PostgreSQL Schema, RLS & Storage
-- ==============================================================================

-- 1. Helper function for automated updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  company TEXT,
  role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER handle_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Automatic user profile creation trigger on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT DEFAULT 'Architecture',
  client_audience TEXT,
  aspect_ratio TEXT NOT NULL DEFAULT '16:9',
  is_published BOOLEAN NOT NULL DEFAULT false,
  share_slug TEXT UNIQUE NOT NULL,
  settings JSONB NOT NULL DEFAULT '{"aspectRatio":"16:9","theme":"dark","showNavigationArrows":true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_share_slug ON public.projects(share_slug);
CREATE INDEX IF NOT EXISTS idx_projects_is_published ON public.projects(is_published);

CREATE TRIGGER handle_updated_at_projects
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 4. Slides Table
CREATE TABLE IF NOT EXISTS public.slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Slide',
  order_index INTEGER NOT NULL DEFAULT 0,
  background_color TEXT DEFAULT '#0C0E12',
  background_image_url TEXT,
  background_overlay_opacity NUMERIC DEFAULT 0,
  transition_type TEXT DEFAULT 'fade',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slides_project_id ON public.slides(project_id);
CREATE INDEX IF NOT EXISTS idx_slides_order ON public.slides(project_id, order_index);

CREATE TRIGGER handle_updated_at_slides
  BEFORE UPDATE ON public.slides
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 5. Elements Table
CREATE TABLE IF NOT EXISTS public.elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slide_id UUID NOT NULL REFERENCES public.slides(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  x NUMERIC NOT NULL DEFAULT 0,
  y NUMERIC NOT NULL DEFAULT 0,
  width NUMERIC NOT NULL DEFAULT 100,
  height NUMERIC NOT NULL DEFAULT 100,
  z_index INTEGER NOT NULL DEFAULT 1,
  rotation NUMERIC NOT NULL DEFAULT 0,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  styles JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_elements_slide_id ON public.elements(slide_id);

CREATE TRIGGER handle_updated_at_elements
  BEFORE UPDATE ON public.elements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elements ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Projects Policies
-- 1) Authenticated Owner full CRUD:
DROP POLICY IF EXISTS "projects_owner_select" ON public.projects;
CREATE POLICY "projects_owner_select" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_owner_insert" ON public.projects;
CREATE POLICY "projects_owner_insert" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_owner_update" ON public.projects;
CREATE POLICY "projects_owner_update" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_owner_delete" ON public.projects;
CREATE POLICY "projects_owner_delete" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- 2) Anonymous & Public Read (ONLY Published Projects):
DROP POLICY IF EXISTS "projects_public_select" ON public.projects;
CREATE POLICY "projects_public_select" ON public.projects
  FOR SELECT USING (is_published = true);

-- Slides Policies
-- 1) Owner full CRUD based on parent project ownership:
DROP POLICY IF EXISTS "slides_owner_select" ON public.slides;
CREATE POLICY "slides_owner_select" ON public.slides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = slides.project_id
        AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "slides_owner_insert" ON public.slides;
CREATE POLICY "slides_owner_insert" ON public.slides
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = slides.project_id
        AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "slides_owner_update" ON public.slides;
CREATE POLICY "slides_owner_update" ON public.slides
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = slides.project_id
        AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "slides_owner_delete" ON public.slides;
CREATE POLICY "slides_owner_delete" ON public.slides
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = slides.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- 2) Public read of slides for published projects:
DROP POLICY IF EXISTS "slides_public_select" ON public.slides;
CREATE POLICY "slides_public_select" ON public.slides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = slides.project_id
        AND projects.is_published = true
    )
  );

-- Elements Policies
-- 1) Owner full CRUD based on parent project ownership:
DROP POLICY IF EXISTS "elements_owner_select" ON public.elements;
CREATE POLICY "elements_owner_select" ON public.elements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.slides
      JOIN public.projects ON projects.id = slides.project_id
      WHERE slides.id = elements.slide_id
        AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "elements_owner_insert" ON public.elements;
CREATE POLICY "elements_owner_insert" ON public.elements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.slides
      JOIN public.projects ON projects.id = slides.project_id
      WHERE slides.id = elements.slide_id
        AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "elements_owner_update" ON public.elements;
CREATE POLICY "elements_owner_update" ON public.elements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.slides
      JOIN public.projects ON projects.id = slides.project_id
      WHERE slides.id = elements.slide_id
        AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "elements_owner_delete" ON public.elements;
CREATE POLICY "elements_owner_delete" ON public.elements
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.slides
      JOIN public.projects ON projects.id = slides.project_id
      WHERE slides.id = elements.slide_id
        AND projects.user_id = auth.uid()
    )
  );

-- 2) Public read of elements for published projects:
DROP POLICY IF EXISTS "elements_public_select" ON public.elements;
CREATE POLICY "elements_public_select" ON public.elements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.slides
      JOIN public.projects ON projects.id = slides.project_id
      WHERE slides.id = elements.slide_id
        AND projects.is_published = true
    )
  );

-- ==============================================================================
-- 7. SUPABASE STORAGE BUCKET & POLICIES
-- ==============================================================================

-- Create public storage bucket for presentation media assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('presentation-assets', 'presentation-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage object policies
-- Owner folder access: user_id/project_id/filename
DROP POLICY IF EXISTS "assets_owner_upload" ON storage.objects;
CREATE POLICY "assets_owner_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'presentation-assets'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "assets_owner_update" ON storage.objects;
CREATE POLICY "assets_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'presentation-assets'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "assets_owner_delete" ON storage.objects;
CREATE POLICY "assets_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'presentation-assets'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read access for presentation media assets
DROP POLICY IF EXISTS "assets_public_read" ON storage.objects;
CREATE POLICY "assets_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'presentation-assets');
