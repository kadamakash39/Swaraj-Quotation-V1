import { createClient } from '@supabase/supabase-js';

// This grabs the secret keys you saved in step 2
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// This creates the actual connection
export const supabase = createClient(supabaseUrl, supabaseKey);
