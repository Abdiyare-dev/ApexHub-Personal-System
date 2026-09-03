export async function syncMilestoneProgress(milestoneId, supabase) {
  try {
    // 1. Fetch milestone
    const { data: milestone, error: fetchError } = await supabase
      .from('milestones')
      .select('*')
      .eq('id', milestoneId)
      .single();

    if (fetchError || !milestone || !milestone.linked_project_id) {
      return null;
    }

    // 2. Count total and completed tasks for that project
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('status')
      .eq('project_id', milestone.linked_project_id);

    if (tasksError) {
      console.error('Error fetching tasks for milestone sync:', tasksError);
      return null;
    }

    const totalTasks = tasks.length;
    // Assuming 'Completed' is the status for done, based on ProductivityContext
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    let autoCompleted = false;

    // 3. If total > 0 AND completed === total -> Auto-complete milestone
    if (totalTasks > 0 && completedTasks === totalTasks && milestone.status !== 'completed') {
      autoCompleted = true;
      
      // Update milestone status to completed
      await supabase
        .from('milestones')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString() 
        })
        .eq('id', milestoneId);
        
      // Trigger cascade unlock
      await cascadeUnlock(milestone.goal_id, milestoneId, supabase);
    }

    return { totalTasks, completedTasks, progressPercent, autoCompleted };
  } catch (err) {
    console.error('Exception in syncMilestoneProgress:', err);
    return null;
  }
}

export async function cascadeUnlock(goalId, completedMilestoneId, supabase) {
  // Fetch all milestones for this goal
  const { data: allMilestones, error: fetchError } = await supabase
    .from('milestones')
    .select('*')
    .eq('goal_id', goalId);

  if (fetchError || !allMilestones) {
    console.error('Error fetching all milestones for cascade:', fetchError);
    return;
  }

  // Find milestones that depend on this newly completed milestone
  const dependentMilestones = allMilestones.filter(m => 
    m.depends_on && m.depends_on.includes(completedMilestoneId) && m.status === 'locked'
  );

  for (const depMilestone of dependentMilestones) {
    let allDepsCompleted = true;
    for (const depId of depMilestone.depends_on) {
      const depRecord = allMilestones.find(m => m.id === depId);
      if (depId === completedMilestoneId) continue;
      
      if (!depRecord || depRecord.status !== 'completed') {
        allDepsCompleted = false;
        break;
      }
    }

    if (allDepsCompleted) {
      // Unlock it!
      await supabase
        .from('milestones')
        .update({ status: 'active' })
        .eq('id', depMilestone.id);
        
      depMilestone.status = 'active'; // Local update
    }
  }

  // Re-evaluate parent goal status
  const allCompleted = allMilestones.every(m => 
    m.id === completedMilestoneId ? true : m.status === 'completed'
  );
  
  await supabase
    .from('goals')
    .update({ status: allCompleted ? 'completed' : 'in_progress' })
    .eq('id', goalId);
}
