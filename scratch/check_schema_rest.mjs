import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
});

async function checkSchema() {
  const headers = { 'apikey': supabaseKey };
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`, { headers });
    const spec = await res.json();
    
    console.log("Goals Schema:", spec.definitions.goals?.properties);
    console.log("Milestones Schema:", spec.definitions.milestones?.properties);
    console.log("Tasks Schema:", spec.definitions.tasks?.properties);
    console.log("Projects Schema:", spec.definitions.projects?.properties);
  } catch (err) {
    console.error("Error:", err);
  }
}

checkSchema();
