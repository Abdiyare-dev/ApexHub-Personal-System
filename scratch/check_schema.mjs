import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data: goals, error: goalsError } = await supabase.from('goals').select('*').limit(1);
  const { data: milestones, error: milestonesError } = await supabase.from('milestones').select('*').limit(1);
  
  console.log("Goals error:", goalsError);
  console.log("Milestones error:", milestonesError);
}

checkSchema();
