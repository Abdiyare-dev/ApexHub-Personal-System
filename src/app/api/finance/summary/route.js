import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

function getMonthDateRange(monthStr) {
  // monthStr: "YYYY-MM"
  const [year, month] = monthStr.split('-').map(Number);
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDayObj = new Date(year, month, 0); // last day of month
  const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(lastDayObj.getDate()).padStart(2, '0')}`;
  return { firstDay, lastDay, year, month };
}

function getLast6MonthsKeys(targetYear, targetMonth) {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(targetYear, targetMonth - 1 - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    months.push(`${y}-${m}`);
  }
  return months;
}

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthParam = searchParams.get('month') || defaultMonth;

    const { firstDay, lastDay, year, month } = getMonthDateRange(monthParam);

    // 1. Fetch categories for user
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id);

    if (catError) {
      return NextResponse.json({ error: catError.message }, { status: 500 });
    }

    const categoryMap = {};
    (categories || []).forEach((c) => {
      categoryMap[c.id] = c;
    });

    // 2. Fetch current month transactions
    const { data: monthTransactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', firstDay)
      .lte('date', lastDay);

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals = {};

    (monthTransactions || []).forEach((tx) => {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        totalIncome += amount;
      } else if (tx.type === 'expense') {
        totalExpense += amount;
        const catId = tx.category_id || 'uncategorized';
        categoryTotals[catId] = (categoryTotals[catId] || 0) + amount;
      }
    });

    const balance = totalIncome - totalExpense;

    // Build byCategory array sorted descending
    const byCategory = Object.entries(categoryTotals)
      .map(([catId, total]) => {
        const cat = categoryMap[catId];
        return {
          categoryId: catId,
          categoryName: cat ? cat.name : 'Uncategorized',
          categoryColor: cat ? cat.color : '#6B7280',
          categoryIcon: cat ? cat.icon : '📌',
          total,
        };
      })
      .sort((a, b) => b.total - a.total);

    // 3. Fetch last 6 months trend
    const sixMonthsAgoObj = new Date(year, month - 1 - 5, 1);
    const sixMonthsAgoStr = `${sixMonthsAgoObj.getFullYear()}-${String(sixMonthsAgoObj.getMonth() + 1).padStart(2, '0')}-01`;

    const { data: trendTransactions, error: trendError } = await supabase
      .from('transactions')
      .select('amount, type, date')
      .eq('user_id', user.id)
      .gte('date', sixMonthsAgoStr)
      .lte('date', lastDay);

    if (trendError) {
      return NextResponse.json({ error: trendError.message }, { status: 500 });
    }

    const monthKeys = getLast6MonthsKeys(year, month);
    const trendMap = {};
    monthKeys.forEach((m) => {
      trendMap[m] = { month: m, income: 0, expense: 0 };
    });

    (trendTransactions || []).forEach((tx) => {
      if (!tx.date) return;
      const txMonth = tx.date.substring(0, 7); // "YYYY-MM"
      if (trendMap[txMonth]) {
        const amt = Number(tx.amount) || 0;
        if (tx.type === 'income') trendMap[txMonth].income += amt;
        if (tx.type === 'expense') trendMap[txMonth].expense += amt;
      }
    });

    const monthlyTrend = monthKeys.map((m) => trendMap[m]);

    return NextResponse.json({
      month: monthParam,
      totalIncome,
      totalExpense,
      balance,
      byCategory,
      monthlyTrend,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
