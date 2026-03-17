import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fdlhrwaoeskndkemkrul.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_esv4McXK9uWhM_wI_9Pimg_wEhNR7GT';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);