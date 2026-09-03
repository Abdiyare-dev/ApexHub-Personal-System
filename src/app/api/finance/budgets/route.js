import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

function getMonthDateRange(monthStr) {
  // Supports "YYYY-MM" or "YYYY-MM-DD"
  const parts = monthStr.split('-').map(Number);
  const year = parts[0];
  const month = parts[1];
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDayObj = new Date(year, month, 0);
  const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(lastDayObj.getDate()).padStart(2, '0')}`;
  return { firstDay, lastDay, monthKey: `${year}-${String(month).padStart(2, '0')}` };
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

    const { firstDay, lastDay } = getMonthDateRange(monthParam);

    // 1. Fetch categories
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

    // 2. Fetch budgets for this month
    const { data: budgets, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', firstDay);

    if (budgetError) {
      return NextResponse.json({ error: budgetError.message }, { status: 500 });
    }

    // 3. Fetch expenses for this month
    const { data: expenses, error: expError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('date', firstDay)
      .lte('date', lastDay);

    if (expError) {
      return NextResponse.json({ error: expError.message }, { status: 500 });
    }

    // Aggregate spending by category_id
    const spentByCategory = {};
    (expenses || []).forEach((tx) => {
      const catId = tx.category_id || 'uncategorized';
      spentByCategory[catId] = (spentByCategory[catId] || 0) + Number(tx.amount || 0);
    });

    // Enriched budgets
    const budgetedCategoryIds = new Set();
    const enrichedBudgets = (budgets || []).map((b) => {
      budgetedCategoryIds.add(b.category_id);
      const category = categoryMap[b.category_id];
      const budgetAmount = Number(b.amount) || 0;
      const actualSpent = spentByCategory[b.category_id] || 0;
      const remaining = budgetAmount - actualSpent;
      const percentUsed = budgetAmount > 0 ? Math.round((actualSpent / budgetAmount) * 100) : 0;

      return {
        ...b,
        categoryName: category ? category.name : 'Category',
        categoryIcon: category ? category.icon : '📌',
        categoryColor: category ? category.color : '#3B82F6',
        amount: budgetAmount,
        actualSpent,
        remaining,
        percentUsed,
      };
    });

    // Unbudgeted spending: categories with spending this month but no budget set
    const unbudgeted = [];
    Object.entries(spentByCategory).forEach(([catId, spent]) => {
      if (!budgetedCategoryIds.has(catId) && spent > 0) {
        const cat = categoryMap[catId];
        unbudgeted.push({
          categoryId: catId,
          categoryName: cat ? cat.name : 'Uncategorized',
          categoryIcon: cat ? cat.icon : '📌',
          categoryColor: cat ? cat.color : '#6B7280',
          actualSpent: spent,
        });
      }
    });

    const totalBudgeted = enrichedBudgets.reduce((acc, b) => acc + b.amount, 0);
    const totalSpentInBudgets = enrichedBudgets.reduce((acc, b) => acc + b.actualSpent, 0);
    const onTrackCount = enrichedBudgets.filter((b) => b.percentUsed <= 90).length;
    const overBudgetCount = enrichedBudgets.filter((b) => b.percentUsed > 100).length;
    const warningCount = enrichedBudgets.filter((b) => b.percentUsed > 90 && b.percentUsed <= 100).length;

    return NextResponse.json({
      month: monthParam,
      firstDay,
      lastDay,
      budgets: enrichedBudgets,
      unbudgeted,
      totalBudgeted,
      totalSpentInBudgets,
      onTrackCount,
      overBudgetCount,
      warningCount,
    });
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
    const { category_id, amount, period = 'monthly', month } = body;

    if (!category_id) {
      return NextResponse.json({ error: 'category_id is required' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'amount must be greater than 0' }, { status: 400 });
    }

    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const targetMonth = month
      ? (month.length === 7 ? `${month}-01` : month)
      : defaultMonth;

    // Check if budget already exists for this category + month + user
    const { data: existing, error: findError } = await supabase
      .from('budgets')
      .select('id')
      .eq('user_id', user.id)
      .eq('category_id', category_id)
      .eq('month', targetMonth)
      .maybeSingle();

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    if (existing) {
      // Update existing
      const { data: updated, error: updateError } = await supabase
        .from('budgets')
        .update({ amount: numAmount, period })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      return NextResponse.json(updated);
    }

    // Insert new
    const { data: inserted, error: insertError } = await supabase
      .from('budgets')
      .insert([
        {
          user_id: user.id,
          category_id,
          amount: numAmount,
          period,
          month: targetMonth,
        },
      ])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(inserted, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
