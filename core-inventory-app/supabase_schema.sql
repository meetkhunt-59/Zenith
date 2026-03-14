-- ==========================================
-- CORE INVENTORY: Supabase Database Schema
-- ==========================================

-- 1. Profiles (Linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manager', 'staff')) DEFAULT 'staff',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile." ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Managers can view all profiles." ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager')
);

-- (User's existing product_categories and products tables assumed to be present)
-- We will just enable RLS on the existing products table just in case it isn't enabled.
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone authenticated can view products." ON public.products;
CREATE POLICY "Anyone authenticated can view products." ON public.products FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Managers can insert products." ON public.products;
CREATE POLICY "Managers can insert products." ON public.products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager')
);

DROP POLICY IF EXISTS "Managers can update products." ON public.products;
CREATE POLICY "Managers can update products." ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager')
);

-- 3. Locations (Warehouses & Racks)
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('warehouse', 'rack', 'production', 'vendor', 'customer')),
  parent_id UUID REFERENCES locations(id) ON DELETE SET NULL, -- for nesting racks in warehouses
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view locations." ON locations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Managers can manage locations." ON locations FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager')
);

-- 4. Stock Levels (Junction recording current physical count)
CREATE TABLE IF NOT EXISTS stock_levels (
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (product_id, location_id)
);

ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view stock levels." ON stock_levels FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage stock levels." ON stock_levels FOR ALL USING (auth.uid() IS NOT NULL);

-- 5. Stock Moves (Ledger of all inventory transactions)
CREATE TABLE IF NOT EXISTS stock_moves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
  from_location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
  to_location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  type TEXT NOT NULL CHECK (type IN ('receipt', 'delivery', 'transfer', 'adjustment')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'done', 'cancelled')) DEFAULT 'draft',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE stock_moves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view moves." ON stock_moves FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert moves." ON stock_moves FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update moves." ON stock_moves FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ==========================================
-- HELPER AUTOMATION (Functions & Triggers)
-- ==========================================

-- Trigger to auto-create a profile when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'manager'); -- Defaulting first user to manager for hackathon ease
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
