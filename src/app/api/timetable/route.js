import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Helper to validate "HH:MM" 24-hour format
function isValidTimeFormat(timeStr) {
  if (typeof timeStr !== 'string') return false;
  const match = timeStr.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return Boolean(match);
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('timetable_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { day_of_week, start_time, end_time, title, category = 'General' } = body;

    // Validation
    const day = Number(day_of_week);
    if (isNaN(day) || day < 0 || day > 6) {
      return NextResponse.json(
        { error: 'day_of_week must be an integer between 0 and 6' },
        { status: 400 }
      );
    }

    if (!isValidTimeFormat(start_time)) {
      return NextResponse.json(
        { error: 'start_time must be in valid HH:MM 24-hour format (e.g. 09:30)' },
        { status: 400 }
      );
    }

    if (!isValidTimeFormat(end_time)) {
      return NextResponse.json(
        { error: 'end_time must be in valid HH:MM 24-hour format (e.g. 11:00)' },
        { status: 400 }
      );
    }

    if (start_time >= end_time) {
      return NextResponse.json(
        { error: 'start_time must be earlier than end_time' },
        { status: 400 }
      );
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'title is required and cannot be empty' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('timetable_entries')
      .insert([
        {
          user_id: user.id,
          day_of_week: day,
          start_time,
          end_time,
          title: title.trim(),
          category: category ? category.trim() : 'General',
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
