import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: goalId } = await params;
    const body = await request.json();
    const { title, description, step_number, due_date, depends_on, linked_project_id } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Auto-status logic
    // If step_number = 1 AND depends_on is empty: set status = 'active'
    // Otherwise: set status = 'locked'
    let status = 'locked';
    if (step_number === 1 && (!depends_on || depends_on.length === 0)) {
      status = 'active';
    }

    const newMilestone = {
      goal_id: goalId,
      user_id: user.id,
      title,
      description: description || '',
      step_number: step_number || 1,
      due_date: due_date || null,
      depends_on: depends_on || [],
      linked_project_id: linked_project_id || null,
      status: status
    };

    const { data, error } = await supabase
      .from('milestones')
      .insert([newMilestone])
      .select()
      .single();

    if (error) {
      console.error('Error creating milestone:', error);
      return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Exception in POST /api/goals/[id]/milestones:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
