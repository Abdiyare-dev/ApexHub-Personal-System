import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: habitId } = await params;
    const body = await request.json();
    const { date } = body;

    if (!date) {
      return NextResponse.json({ error: 'Date is required (YYYY-MM-DD)' }, { status: 400 });
    }

    // Verify the habit belongs to the authenticated user
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('id')
      .eq('id', habitId)
      .eq('user_id', user.id)
      .single();

    if (habitError || !habit) {
      return NextResponse.json({ error: 'Habit not found or unauthorized' }, { status: 404 });
    }

    const logDate = date.split('T')[0];

    // Check if habit_logs record exists for this habit_id + log_date
    const { data: existingLog, error: fetchLogError } = await supabase
      .from('habit_logs')
      .select('id, completed')
      .eq('habit_id', habitId)
      .eq('log_date', logDate)
      .maybeSingle();

    if (fetchLogError) {
      return NextResponse.json({ error: fetchLogError.message }, { status: 500 });
    }

    if (existingLog) {
      // If exists, delete / toggle off
      const { error: deleteError } = await supabase
        .from('habit_logs')
        .delete()
        .eq('id', existingLog.id);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      return NextResponse.json({ completed: false, date: logDate });
    } else {
      // If not exists, insert / toggle on
      const { error: insertError } = await supabase
        .from('habit_logs')
        .insert([
          {
            habit_id: habitId,
            log_date: logDate,
            completed: true,
          },
        ]);

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ completed: true, date: logDate });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
