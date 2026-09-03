import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const goals = (data || []).map((g) => {
      const target = Number(g.target_amount) || 0;
      const current = Number(g.current_amount) || 0;
      const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
      return {
        ...g,
        target_amount: target,
        current_amount: current,
        percent,
      };
    });

    return NextResponse.json(goals);
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
    const { title, targetAmount, deadline } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const numTarget = Number(targetAmount);
    if (isNaN(numTarget) || numTarget <= 0) {
      return NextResponse.json({ error: 'targetAmount must be greater than 0' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('savings_goals')
      .insert([
        {
          user_id: user.id,
          title: title.trim(),
          target_amount: numTarget,
          current_amount: 0,
          deadline: deadline || null,
          status: 'active',
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
