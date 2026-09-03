import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const DAY_NAMES_SAT_FIRST = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

function getDayCode(dayNum) {
  const d = Number(dayNum);
  if (d >= 1 && d <= 7) {
    // 1-indexed Saturday = 1 ... Friday = 7
    return DAY_NAMES_SAT_FIRST[d - 1];
  }
  if (d >= 0 && d <= 6) {
    // 0-indexed Saturday = 0 ... Friday = 6
    return DAY_NAMES_SAT_FIRST[d];
  }
  return 'sat';
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({ all: true }));
    const { all = true, entryIds = [] } = body;

    // Fetch timetable entries
    let query = supabase.from('timetable_entries').select('*').eq('user_id', user.id);

    if (!all && Array.isArray(entryIds) && entryIds.length > 0) {
      query = query.in('id', entryIds);
    }

    const { data: timetableEntries, error: fetchTtError } = await query;

    if (fetchTtError) {
      return NextResponse.json({ error: fetchTtError.message }, { status: 500 });
    }

    if (!timetableEntries || timetableEntries.length === 0) {
      return NextResponse.json({ created: 0, skipped: 0, message: 'No timetable entries found' });
    }

    // Fetch existing timetable-derived tasks to avoid duplicate conversion
    const { data: existingTasks, error: fetchTasksError } = await supabase
      .from('tasks')
      .select('title, recurrence_rule, is_from_timetable')
      .eq('user_id', user.id)
      .eq('is_from_timetable', true);

    if (fetchTasksError) {
      return NextResponse.json({ error: fetchTasksError.message }, { status: 500 });
    }

    const existingKeySet = new Set(
      (existingTasks || []).map((t) => `${t.title?.toLowerCase()}|${t.recurrence_rule?.toLowerCase()}`)
    );

    const tasksToInsert = [];
    let skippedCount = 0;

    for (const entry of timetableEntries) {
      const dayCode = getDayCode(entry.day_of_week);
      const recurrenceRule = `weekly:${dayCode}`;
      const taskKey = `${entry.title?.toLowerCase()}|${recurrenceRule.toLowerCase()}`;

      if (existingKeySet.has(taskKey)) {
        skippedCount++;
      } else {
        tasksToInsert.push({
          user_id: user.id,
          title: entry.title,
          is_recurring: true,
          recurrence_rule: recurrenceRule,
          category: entry.category || 'General',
          is_from_timetable: true,
          status: 'pending',
          priority: 'medium',
        });
        existingKeySet.add(taskKey);
      }
    }

    let createdCount = 0;
    if (tasksToInsert.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('tasks')
        .insert(tasksToInsert)
        .select();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      createdCount = inserted ? inserted.length : tasksToInsert.length;
    }

    return NextResponse.json({
      created: createdCount,
      skipped: skippedCount,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
