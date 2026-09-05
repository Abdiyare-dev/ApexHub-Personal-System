import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const mood = searchParams.get('mood'); // e.g. 'great,good'
    const tag = searchParams.get('tag');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);
    if (mood) {
      const moods = mood.split(',');
      query = query.in('mood', moods);
    }
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ entries: data });
  } catch (err) {
    console.error('Exception in GET /api/journal:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { date, content, mood, tags } = body;

    if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 });

    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        date,
        content: content || '',
        mood: mood || 'neutral',
        tags: tags || []
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (already exists for date)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Entry already exists for this date' }, { status: 409 });
      }
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (err) {
    console.error('Exception in POST /api/journal:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
