-- AI Student Doubt Platform — image attachments for chat messages
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query > Run).
-- Adds an optional JSONB column that stores uploaded image/file parts (data URLs)
-- attached to a user message so they survive page reloads.

alter table public.messages
  add column if not exists attachments jsonb;