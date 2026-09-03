import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

function isValidTimeFormat(timeStr) {
  if (typeof timeStr !== 'string') return false;
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr.trim());
}

// Convert "HH:MM" to total minutes for overlap calculation
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.trim().split(':').map(Number);
  return hours * 60 + minutes;
}

// Check if two time slots overlap on the same day
function isTimeOverlap(startA, endA, startB, endB) {
  const minStartA = timeToMinutes(startA);
  const minEndA = timeToMinutes(endA);
  const minStartB = timeToMinutes(startB);
  const minEndB = timeToMinutes(endB);

  return Math.max(minStartA, minStartB) < Math.min(minEndA, minEndB);
}

// Map day string / number to 0-6 (Saturday = 0 ... Friday = 6)
export function parseDayOfWeek(val) {
  if (typeof val === 'number') {
    if (val >= 1 && val <= 7) return val - 1; // 1-indexed (1=Sat..7=Fri) -> 0..6
    if (val >= 0 && val <= 6) return val;
  }
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s.startsWith('sat')) return 0;
    if (s.startsWith('sun')) return 1;
    if (s.startsWith('mon')) return 2;
    if (s.startsWith('tue')) return 3;
    if (s.startsWith('wed')) return 4;
    if (s.startsWith('thu')) return 5;
    if (s.startsWith('fri')) return 6;

    const num = parseInt(s, 10);
    if (!isNaN(num)) {
      if (num >= 1 && num <= 7) return num - 1;
      if (num >= 0 && num <= 6) return num;
    }
  }
  return null;
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { entries = [], replaceExisting = false } = body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'No timetable entries provided for import' }, { status: 400 });
    }

    // Step 1: Validate EVERY entry before performing any mutation
    const validationErrors = [];
    const sanitizedEntries = [];

    entries.forEach((entry, idx) => {
      const rowNum = idx + 1;
      const parsedDay = parseDayOfWeek(entry.day_of_week !== undefined ? entry.day_of_week : entry.day);

      if (parsedDay === null || parsedDay < 0 || parsedDay > 6) {
        validationErrors.push(
          `Row ${rowNum}: Invalid day of week "${entry.day_of_week || entry.day}". Expected Saturday–Friday or 1–7.`
        );
      }

      const startTime = String(entry.start_time || entry['Start Time'] || '').trim();
      const endTime = String(entry.end_time || entry['End Time'] || '').trim();
      const title = String(entry.title || entry.Activity || entry.activity || '').trim();
      const category = String(entry.category || entry.Category || 'General').trim() || 'General';

      if (!isValidTimeFormat(startTime)) {
        validationErrors.push(`Row ${rowNum}: Start time "${startTime}" is invalid. Expected HH:MM 24-hour format.`);
      }

      if (!isValidTimeFormat(endTime)) {
        validationErrors.push(`Row ${rowNum}: End time "${endTime}" is invalid. Expected HH:MM 24-hour format.`);
      }

      if (isValidTimeFormat(startTime) && isValidTimeFormat(endTime) && startTime >= endTime) {
        validationErrors.push(`Row ${rowNum}: Start time (${startTime}) must be earlier than End time (${endTime}).`);
      }

      if (!title) {
        validationErrors.push(`Row ${rowNum}: Activity / Title is required and cannot be empty.`);
      }

      if (parsedDay !== null && isValidTimeFormat(startTime) && isValidTimeFormat(endTime) && startTime < endTime && title) {
        sanitizedEntries.push({
          user_id: user.id,
          day_of_week: parsedDay,
          start_time: startTime,
          end_time: endTime,
          title,
          category,
          is_active: true,
        });
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed on one or more entries',
          errors: validationErrors,
          imported: 0,
          skipped: 0,
        },
        { status: 400 }
      );
    }

    // Step 2: Handle Replace Existing
    if (replaceExisting) {
      const { error: deleteError } = await supabase
        .from('timetable_entries')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      const { data: inserted, error: insertError } = await supabase
        .from('timetable_entries')
        .insert(sanitizedEntries)
        .select();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({
        imported: inserted ? inserted.length : sanitizedEntries.length,
        skipped: 0,
        errors: [],
      });
    }

    // Step 3: Incremental Import (Skip conflicts with existing schedule)
    const { data: existingEntries, error: fetchError } = await supabase
      .from('timetable_entries')
      .select('*')
      .eq('user_id', user.id);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const currentSchedule = existingEntries || [];
    const entriesToInsert = [];
    let skippedCount = 0;

    for (const newEntry of sanitizedEntries) {
      const conflict = [...currentSchedule, ...entriesToInsert].some(
        (existing) =>
          existing.day_of_week === newEntry.day_of_week &&
          isTimeOverlap(existing.start_time, existing.end_time, newEntry.start_time, newEntry.end_time)
      );

      if (conflict) {
        skippedCount++;
      } else {
        entriesToInsert.push(newEntry);
      }
    }

    let insertedCount = 0;
    if (entriesToInsert.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('timetable_entries')
        .insert(entriesToInsert)
        .select();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      insertedCount = inserted ? inserted.length : entriesToInsert.length;
    }

    return NextResponse.json({
      imported: insertedCount,
      skipped: skippedCount,
      errors: [],
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
