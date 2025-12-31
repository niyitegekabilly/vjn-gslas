
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://odiukwlqorbjuipntmzj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_N9iNL4jvMPZ4z5JNiVDDnw_NkXFwNjp';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
