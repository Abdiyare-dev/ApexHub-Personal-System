import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('date, mood, tags')
      .eq('user_id', user.id)
      .gte('date', cutoffDateStr)
      .order('date', { ascending: false });

    if (error) throw error;

    const stats = {
      moodCounts: {},
      totalEntries: entries.length,
      currentStreak: 0,
      tags: {}
    };

    if (entries.length > 0) {
      // Calculate mood counts and tags
      entries.forEach(entry => {
        // Moods
        const m = entry.mood || 'neutral';
        stats.moodCounts[m] = (stats.moodCounts[m] || 0) + 1;
        
        // Tags
        if (Array.isArray(entry.tags)) {
          entry.tags.forEach(tag => {
            stats.tags[tag] = (stats.tags[tag] || 0) + 1;
          });
        }
      });

      // Calculate streak
      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0,0,0,0);
      
      // Convert entries to a set of dates
      const entryDates = new Set(entries.map(e => e.date));
      
      // Check today or yesterday as start of streak
      const todayStr = currentDate.toISOString().split('T')[0];
      const yesterdayDate = new Date(currentDate);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

      let checkDate = new Date(currentDate);
      if (entryDates.has(todayStr)) {
        // Streak includes today
      } else if (entryDates.has(yesterdayStr)) {
        // Streak includes yesterday
        checkDate = yesterdayDate;
      } else {
        // No current streak
        checkDate = null;
      }

      if (checkDate) {
        while (true) {
          const checkStr = checkDate.toISOString().split('T')[0];
          if (entryDates.has(checkStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
      stats.currentStreak = streak;
    }

    // Format tags as array sorted by count
    const sortedTags = Object.entries(stats.tags)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    stats.tags = sortedTags;

    return NextResponse.json(stats);
  } catch (err) {
    console.error('Exception in GET /api/journal/stats:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
