import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mock.supabase.co';
const supabaseAnonKey = 'mock-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
