import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { date } = await params;

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json(null);

    return NextResponse.json(data);
  } catch (err) {
    console.error('Exception in GET /api/journal/[date]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { date } = await params;
    const body = await request.json();
    const { content, mood, tags } = body;

    const updates = {};
    if (content !== undefined) updates.content = content;
    if (mood !== undefined) updates.mood = mood;
    if (tags !== undefined) updates.tags = tags;
    
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('journal_entries')
      .update(updates)
      .eq('date', date)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error('Exception in PUT /api/journal/[date]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { date } = await params;

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('date', date)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Exception in DELETE /api/journal/[date]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
