import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const weekOf = searchParams.get('weekOf'); // YYYY-MM-DD format (usually a Monday)
    
    if (!weekOf) {
      return NextResponse.json({ error: 'Missing weekOf parameter' }, { status: 400 });
    }

    const startDate = new Date(weekOf);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7); // end of week

    // Fetch planner items for the week
    const { data: plannerItems, error: pError } = await supabase
      .from('planner_items')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .lt('date', endDate.toISOString().split('T')[0])
      .order('created_at', { ascending: true });

    if (pError) throw pError;

    return NextResponse.json({ plannerItems });
  } catch (err) {
    console.error('Exception in GET /api/planner:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { date, type, content, linked_task_id } = body;

    if (!date || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('planner_items')
      .insert({
        user_id: user.id,
        date,
        type,
        content,
        linked_task_id
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error('Exception in POST /api/planner:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
