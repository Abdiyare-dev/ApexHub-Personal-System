import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: goalId } = await params;
    const body = await request.json();
    
    // Expecting array: [{ id: 'uuid', step_number: 1 }, ...]
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid payload format. Expected an array.' }, { status: 400 });
    }

    // Since Supabase REST doesn't support bulk updates natively in a single request,
    // we'll update them sequentially.
    for (const item of body) {
      if (item.id && typeof item.step_number === 'number') {
        const { error } = await supabase
          .from('milestones')
          .update({ step_number: item.step_number })
          .eq('id', item.id)
          .eq('goal_id', goalId)
          .eq('user_id', user.id);
          
        if (error) {
          console.error(`Error updating step_number for milestone ${item.id}:`, error);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Exception in PATCH /api/goals/[id]/milestones/reorder:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
