import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env['VITE_SUPABASE_URL'] || 'https://ohhlfsnyiokxqcyvhnzg.supabase.co';
const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oaGxmc255aW9reHFjeXZobnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUzODAzNTksImV4cCI6MjExMDk1NjM1OX0.F5z4OjjTHpBVg97TFgAvag4z7ctXGB248fAyFPCt-jk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchLiveQuests() {
  const { data, error } = await supabase.from('quests').select('*');
  if (error) {
    console.warn('Failed to fetch quests from Supabase, using local fallback', error);
    return null;
  }
  return data;
}

export async function fetchLivePlaces() {
  const { data, error } = await supabase.from('places').select('*');
  if (error) {
    console.warn('Failed to fetch places from Supabase, using local fallback', error);
    return null;
  }
  return data;
}

export async function fetchLiveOffers() {
  const { data, error } = await supabase.from('offers').select('*');
  if (error) {
    console.warn('Failed to fetch offers from Supabase, using local fallback', error);
    return null;
  }
  return data;
}
