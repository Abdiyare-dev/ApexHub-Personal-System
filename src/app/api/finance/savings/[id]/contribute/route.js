import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { amount } = body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Contribution amount must be greater than 0' }, { status: 400 });
    }

    // Fetch current goal
    const { data: goal, error: fetchError } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !goal) {
      return NextResponse.json({ error: 'Savings goal not found' }, { status: 404 });
    }

    const newCurrent = Number(goal.current_amount || 0) + numAmount;
    const target = Number(goal.target_amount || 0);
    const newStatus = newCurrent >= target ? 'reached' : goal.status;

    const { data: updated, error: updateError } = await supabase
      .from('savings_goals')
      .update({
        current_amount: newCurrent,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      ...updated,
      target_amount: target,
      current_amount: newCurrent,
      percent: target > 0 ? Math.min(100, Math.round((newCurrent / target) * 100)) : 0,
      justReached: newCurrent >= target && goal.status !== 'reached',
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
