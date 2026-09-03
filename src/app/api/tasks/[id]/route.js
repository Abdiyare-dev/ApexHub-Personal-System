import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncMilestoneProgress } from '@/lib/milestone-sync';

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, text, due_date, goal_id, project_id, completed } = body;

    // Normalizing status in case client sends 'completed' instead of 'Completed'
    let finalStatus = status;
    if (completed !== undefined) {
      finalStatus = completed ? 'Completed' : 'Pending';
    }

    const updates = {};
    if (finalStatus !== undefined) updates.status = finalStatus;
    if (text !== undefined) updates.text = text;
    if (due_date !== undefined) updates.due_date = due_date;
    if (goal_id !== undefined) updates.goal_id = goal_id;
    if (project_id !== undefined) updates.project_id = project_id;

    updates.updated_at = new Date().toISOString();

    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    // THE LIVE BRIDGE: Sync milestone if task belongs to a project
    if (updatedTask.project_id) {
      // Find if any milestone links to this project
      const { data: milestones } = await supabase
        .from('milestones')
        .select('id')
        .eq('linked_project_id', updatedTask.project_id);

      if (milestones && milestones.length > 0) {
        for (const m of milestones) {
          await syncMilestoneProgress(m.id, supabase);
        }
      }
    }

    return NextResponse.json(updatedTask);
  } catch (err) {
    console.error('Exception in PUT /api/tasks/[id]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
