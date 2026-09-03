import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const targetMonthStr = body.month || defaultMonth;

    const [tYear, tMonth] = targetMonthStr.split('-').map(Number);
    const targetFirstDay = `${tYear}-${String(tMonth).padStart(2, '0')}-01`;

    // Calculate previous month
    const prevDateObj = new Date(tYear, tMonth - 2, 1);
    const prevFirstDay = `${prevDateObj.getFullYear()}-${String(prevDateObj.getMonth() + 1).padStart(2, '0')}-01`;

    // Fetch previous month budgets
    const { data: prevBudgets, error: prevError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', prevFirstDay);

    if (prevError) {
      return NextResponse.json({ error: prevError.message }, { status: 500 });
    }

    if (!prevBudgets || prevBudgets.length === 0) {
      return NextResponse.json({
        copied: 0,
        skipped: 0,
        message: 'No budgets found in previous month to copy',
      });
    }

    // Fetch existing target month budgets
    const { data: currentBudgets, error: currError } = await supabase
      .from('budgets')
      .select('category_id')
      .eq('user_id', user.id)
      .eq('month', targetFirstDay);

    if (currError) {
      return NextResponse.json({ error: currError.message }, { status: 500 });
    }

    const currentCatSet = new Set((currentBudgets || []).map((b) => b.category_id));

    const toInsert = [];
    let skipped = 0;

    for (const b of prevBudgets) {
      if (currentCatSet.has(b.category_id)) {
        skipped++;
      } else {
        toInsert.push({
          user_id: user.id,
          category_id: b.category_id,
          amount: b.amount,
          period: b.period || 'monthly',
          month: targetFirstDay,
        });
        currentCatSet.add(b.category_id);
      }
    }

    let copied = 0;
    if (toInsert.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('budgets')
        .insert(toInsert)
        .select();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      copied = inserted ? inserted.length : toInsert.length;
    }

    return NextResponse.json({
      copied,
      skipped,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
