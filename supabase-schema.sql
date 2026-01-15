-- Database Schema for TravelAI Chat-Style Itineraries
-- Run this in your Supabase SQL Editor

-- Create itineraries table with chat history support
CREATE TABLE IF NOT EXISTS itineraries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  duration INTEGER NOT NULL,
  travel_style TEXT CHECK (travel_style IN ('Solo', 'Couple', 'Family', 'Friends')),
  pace TEXT CHECK (pace IN ('Relaxed', 'Balanced', 'Intense')),
  transport TEXT CHECK (transport IN ('Walking', 'Public Transport', 'Rental Car')),
  dietary_restrictions TEXT,
  interests TEXT,
  itinerary_data JSONB NOT NULL,
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to insert their own itineraries
CREATE POLICY "Users can insert their own itineraries"
  ON itineraries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to read their own itineraries
CREATE POLICY "Users can read their own itineraries"
  ON itineraries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy to allow users to update their own itineraries
CREATE POLICY "Users can update their own itineraries"
  ON itineraries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own itineraries
CREATE POLICY "Users can delete their own itineraries"
  ON itineraries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS itineraries_user_id_idx ON itineraries(user_id);
CREATE INDEX IF NOT EXISTS itineraries_created_at_idx ON itineraries(created_at DESC);
