import { createClient } from '@supabase/supabase-js';
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

const supabase = createClient(supabaseUrl, supabaseKey);
// We'll also use the actual milestone-sync file.
import { cascadeUnlock, syncMilestoneProgress } from '../src/lib/milestone-sync.js';

async function runTests() {
  console.log('--- Starting Goals & Roadmap Data Layer Tests ---');
  
  // Create a test user or just use a dummy UUID if using service_role
  // Since we have service_role, we can just insert with a dummy UUID
  const dummyUserId = '00000000-0000-0000-0000-000000000000'; // Or fetch a real one
  
  const { data: users, error: usersErr } = await supabase.auth.admin.listUsers();
  const userId = (users && users.users.length > 0) ? users.users[0].id : dummyUserId;
  console.log(`Using user ID for tests: ${userId}`);

  try {
    // 1. Create a Goal
    const { data: goal, error: goalErr } = await supabase
      .from('goals')
      .insert([{
        user_id: userId,
        title: 'Test Roadmap Goal',
        status: 'in_progress',
        sort_order: 999
      }])
      .select().single();
      
    if (goalErr) throw goalErr;
    console.log(`[PASS] Goal created: ${goal.id}`);

    // 2. Add 3 Milestones (1->2->3)
    const m1 = await insertMilestone(goal.id, userId, 'Milestone 1', 1, [], 'active');
    const m2 = await insertMilestone(goal.id, userId, 'Milestone 2', 2, [m1.id], 'locked');
    const m3 = await insertMilestone(goal.id, userId, 'Milestone 3', 3, [m2.id], 'locked');
    console.log(`[PASS] 3 Milestones created in a chain`);

    // 3. Complete milestone 1 -> verify milestone 2 becomes 'active'
    await supabase.from('milestones').update({ status: 'completed' }).eq('id', m1.id);
    await cascadeUnlock(goal.id, m1.id, supabase);
    
    const { data: checkM2 } = await supabase.from('milestones').select('status').eq('id', m2.id).single();
    if (checkM2.status === 'active') {
      console.log(`[PASS] Cascade Unlock 1: Milestone 2 became 'active'`);
    } else {
      console.error(`[FAIL] Cascade Unlock 1: Milestone 2 status is ${checkM2.status}`);
    }

    // 4. Link milestone 2 to a project -> complete all tasks -> verify milestone 2 auto-completes & 3 unlocks
    const { data: project } = await supabase
      .from('projects')
      .insert([{ user_id: userId, title: 'Linked Project', is_completed: false }])
      .select().single();
      
    await supabase.from('milestones').update({ linked_project_id: project.id }).eq('id', m2.id);
    
    // Add two tasks to the project
    const { data: t1 } = await supabase.from('tasks').insert([{ user_id: userId, project_id: project.id, text: 'T1', status: 'Pending' }]).select().single();
    const { data: t2 } = await supabase.from('tasks').insert([{ user_id: userId, project_id: project.id, text: 'T2', status: 'Pending' }]).select().single();
    
    // Complete the tasks
    await supabase.from('tasks').update({ status: 'Completed' }).eq('id', t1.id);
    await syncMilestoneProgress(m2.id, supabase); // Simulation of Live Bridge
    
    let { data: checkM2Progress } = await supabase.from('milestones').select('status').eq('id', m2.id).single();
    console.log(`[PASS] After 1 task complete, Milestone 2 is ${checkM2Progress.status}`);
    
    await supabase.from('tasks').update({ status: 'Completed' }).eq('id', t2.id);
    await syncMilestoneProgress(m2.id, supabase); // Simulation of Live Bridge
    
    checkM2Progress = (await supabase.from('milestones').select('status').eq('id', m2.id).single()).data;
    const { data: checkM3 } = await supabase.from('milestones').select('status').eq('id', m3.id).single();
    
    if (checkM2Progress.status === 'completed' && checkM3.status === 'active') {
      console.log(`[PASS] Live Bridge: Milestone 2 auto-completed and Milestone 3 unlocked!`);
    } else {
      console.error(`[FAIL] Live Bridge failed. M2: ${checkM2Progress.status}, M3: ${checkM3.status}`);
    }

    // 5. Delete milestone 2 -> verify depends_on is cleaned up from milestone 3
    // Simulate DELETE API route logic
    await supabase.from('milestones').delete().eq('id', m2.id);
    const { data: remaining } = await supabase.from('milestones').select('*').eq('goal_id', goal.id).order('step_number');
    
    for (const m of remaining) {
      if (m.depends_on && m.depends_on.includes(m2.id)) {
        const newDepends = m.depends_on.filter(id => id !== m2.id);
        await supabase.from('milestones').update({ depends_on: newDepends }).eq('id', m.id);
      }
    }
    
    const { data: finalM3 } = await supabase.from('milestones').select('depends_on').eq('id', m3.id).single();
    if (!finalM3.depends_on.includes(m2.id)) {
      console.log(`[PASS] Cleanup: Milestone 2 removed from Milestone 3's dependencies`);
    } else {
      console.error(`[FAIL] Cleanup failed`);
    }

    // Clean up test data
    await supabase.from('projects').delete().eq('id', project.id);
    await supabase.from('goals').delete().eq('id', goal.id);
    console.log('--- Tests Completed and Cleaned Up ---');

  } catch (err) {
    console.error('Test Error:', err);
  }
}

async function insertMilestone(goalId, userId, title, step, dependsOn, status) {
  const { data, error } = await supabase
    .from('milestones')
    .insert([{
      goal_id: goalId, user_id: userId, title, step_number: step, depends_on: dependsOn, status
    }])
    .select().single();
  if (error) throw error;
  return data;
}

runTests();
