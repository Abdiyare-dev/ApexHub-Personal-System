// Backward-compatibility shim
// New code should import from '@/lib/supabase/client' (browser)
// or '@/lib/supabase/server' (server) directly.
import { createClient } from '@/lib/supabase/client';

export const supabase = createClient();
