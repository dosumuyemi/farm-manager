-- Farm Manager Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Animal Houses table
CREATE TABLE IF NOT EXISTS animal_houses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  animal_type TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  age_weeks INTEGER NOT NULL DEFAULT 0,
  average_weight DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT
);

-- Cells table (for house cells/cages)
CREATE TABLE IF NOT EXISTS cells (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id UUID REFERENCES animal_houses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  row_name TEXT NOT NULL,
  position INTEGER NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 50,
  current_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'empty',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial records table
CREATE TABLE IF NOT EXISTS financial_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id TEXT NOT NULL,
  house_id TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  amount DECIMAL(12,2) NOT NULL,
  sender TEXT,
  receiver TEXT,
  purpose TEXT,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'expense',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Egg records table
CREATE TABLE IF NOT EXISTS egg_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id TEXT NOT NULL,
  house_id TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cage_no TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  cracks INTEGER NOT NULL DEFAULT 0,
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weight records table
CREATE TABLE IF NOT EXISTS weight_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  weight DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id TEXT,
  name TEXT NOT NULL,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'Medium',
  frequency TEXT NOT NULL DEFAULT 'One-off',
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cells_house_id ON cells(house_id);
CREATE INDEX IF NOT EXISTS idx_financial_farm_id ON financial_records(farm_id);
CREATE INDEX IF NOT EXISTS idx_financial_type ON financial_records(type);
CREATE INDEX IF NOT EXISTS idx_eggs_farm_id ON egg_records(farm_id);
CREATE INDEX IF NOT EXISTS idx_weight_house_id ON weight_records(house_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Enable Row Level Security (RLS)
ALTER TABLE animal_houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE egg_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for now - can restrict later)
CREATE POLICY "Allow public read/write" ON animal_houses FOR ALL USING (true);
CREATE POLICY "Allow public read/write" ON cells FOR ALL USING (true);
CREATE POLICY "Allow public read/write" ON financial_records FOR ALL USING (true);
CREATE POLICY "Allow public read/write" ON egg_records FOR ALL USING (true);
CREATE POLICY "Allow public read/write" ON weight_records FOR ALL USING (true);
CREATE POLICY "Allow public read/write" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow public read/write" ON notes FOR ALL USING (true);
