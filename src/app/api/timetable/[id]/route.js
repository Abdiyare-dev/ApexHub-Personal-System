import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

function isValidTimeFormat(timeStr) {
  if (typeof timeStr !== 'string') return false;
  const match = timeStr.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return Boolean(match);
}

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updates = {};
    if (body.day_of_week !== undefined) {
      const day = Number(body.day_of_week);
      if (isNaN(day) || day < 0 || day > 6) {
        return NextResponse.json({ error: 'day_of_week must be 0-6' }, { status: 400 });
      }
      updates.day_of_week = day;
    }

    if (body.start_time !== undefined) {
      if (!isValidTimeFormat(body.start_time)) {
        return NextResponse.json({ error: 'Invalid start_time format (HH:MM)' }, { status: 400 });
      }
      updates.start_time = body.start_time;
    }

    if (body.end_time !== undefined) {
      if (!isValidTimeFormat(body.end_time)) {
        return NextResponse.json({ error: 'Invalid end_time format (HH:MM)' }, { status: 400 });
      }
      updates.end_time = body.end_time;
    }

    if (updates.start_time && updates.end_time && updates.start_time >= updates.end_time) {
      return NextResponse.json({ error: 'start_time must be earlier than end_time' }, { status: 400 });
    }

    if (body.title !== undefined) {
      if (!body.title.trim()) {
        return NextResponse.json({ error: 'title cannot be empty' }, { status: 400 });
      }
      updates.title = body.title.trim();
    }

    if (body.category !== undefined) {
      updates.category = body.category ? body.category.trim() : 'General';
    }

    if (body.is_active !== undefined) {
      updates.is_active = Boolean(body.is_active);
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('timetable_entries')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabase
      .from('timetable_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
