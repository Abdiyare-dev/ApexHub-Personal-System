import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: goalId, milestoneId } = await params;
    const body = await request.json();
    
    // Extract update fields
    const updates = { ...body };
    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.user_id;
    delete updates.goal_id;

    let isCompleting = false;

    if (updates.status === 'completed') {
      updates.completed_at = new Date().toISOString();
      isCompleting = true;
    } else if (updates.status && updates.status !== 'completed') {
      updates.completed_at = null;
    }

    // 1. Update the milestone
    const { data: updatedMilestone, error: updateError } = await supabase
      .from('milestones')
      .update(updates)
      .eq('id', milestoneId)
      .eq('goal_id', goalId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating milestone:', updateError);
      return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
    }

    // 2. Cascade logic if completed
    if (isCompleting) {
      const { cascadeUnlock } = await import('@/lib/milestone-sync');
      await cascadeUnlock(goalId, milestoneId, supabase);
    }

    return NextResponse.json(updatedMilestone);
  } catch (err) {
    console.error('Exception in PUT /api/goals/[id]/milestones/[milestoneId]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: goalId, milestoneId } = await params;

    // 1. Delete the milestone
    const { error: deleteError } = await supabase
      .from('milestones')
      .delete()
      .eq('id', milestoneId)
      .eq('goal_id', goalId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting milestone:', deleteError);
      return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 });
    }

    // 2. Fetch remaining milestones to clean up depends_on and recalculate step_number
    const { data: remaining, error: fetchError } = await supabase
      .from('milestones')
      .select('*')
      .eq('goal_id', goalId)
      .order('step_number', { ascending: true });

    if (!fetchError && remaining) {
      let step = 1;
      for (const m of remaining) {
        let needsUpdate = false;
        const updates = {};

        // Recalculate step
        if (m.step_number !== step) {
          updates.step_number = step;
          needsUpdate = true;
        }

        // Clean up depends_on
        if (m.depends_on && m.depends_on.includes(milestoneId)) {
          updates.depends_on = m.depends_on.filter(id => id !== milestoneId);
          needsUpdate = true;
          
          // Auto-unlock if depends_on becomes empty and step is 1
          if (updates.depends_on.length === 0 && updates.step_number === 1 && m.status === 'locked') {
            updates.status = 'active';
          }
        }

        if (needsUpdate) {
          await supabase
            .from('milestones')
            .update(updates)
            .eq('id', m.id);
        }
        step++;
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Exception in DELETE /api/goals/[id]/milestones/[milestoneId]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
