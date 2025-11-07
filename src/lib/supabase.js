import { createClient } from '@supabase/supabase-js'

// Read env at build time; guard to support demo mode when not configured
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'your_supabase_url_here' &&
  supabaseUrl !== 'https://placeholder.supabase.co'
)

// Only create the client when config exists; otherwise export null
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null

// Supabase table schemas (for reference)
/*
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female')),
  phone_number TEXT,
  age INTEGER,
  current_level TEXT CHECK (current_level IN ('SHS1', 'SHS2', 'SHS3', 'JHS1', 'JHS2', 'JHS3', 'COMPLETED', 'UNIVERSITY')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  present BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(member_id, attendance_date)
);

CREATE TABLE monthly_tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT UNIQUE NOT NULL,
  month_year TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
*/