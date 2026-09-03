import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select(`
        *,
        milestones(
          *,
          linked_project:projects(
            id, title, color,
            tasks(id, status)
          )
        )
      `)
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });

    if (goalsError) {
      console.error('Error fetching goals:', goalsError);
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }

    // Compute stats
    const computedGoals = (goals || []).map(goal => {
      let totalMilestones = 0;
      let completedMilestones = 0;

      const computedMilestones = (goal.milestones || []).map(ms => {
        totalMilestones++;
        if (ms.status === 'completed') completedMilestones++;

        let totalTasks = 0;
        let completedTasks = 0;
        let msProgress = 0;

        if (ms.linked_project) {
          const projectTasks = ms.linked_project.tasks || [];
          totalTasks = projectTasks.length;
          completedTasks = projectTasks.filter(t => t.status === 'Completed').length; // using 'Completed' based on ProductivityContext
          msProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        }

        return {
          ...ms,
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          progress_percent: msProgress
        };
      });

      // Sort milestones by step_number
      computedMilestones.sort((a, b) => a.step_number - b.step_number);

      const goalProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

      return {
        ...goal,
        milestones: computedMilestones,
        total_milestones: totalMilestones,
        completed_milestones: completedMilestones,
        progress_percent: goalProgress
      };
    });

    return NextResponse.json(computedGoals);
  } catch (err) {
    console.error('Exception in GET /api/goals:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
    const { title, description, category, target_date, color } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Get max sort_order
    const { data: maxGoal } = await supabase
      .from('goals')
      .select('sort_order')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: false })
      .limit(1);
    
    const nextOrder = (maxGoal && maxGoal.length > 0) ? (maxGoal[0].sort_order || 0) + 1 : 1;

    const newGoal = {
      user_id: user.id,
      title,
      description: description || '',
      category: category || 'General',
      target_date: target_date || null,
      color: color || '#3B82F6',
      status: 'in_progress', // Default status
      sort_order: nextOrder
    };

    const { data, error } = await supabase
      .from('goals')
      .insert([newGoal])
      .select()
      .single();

    if (error) {
      console.error('Error creating goal:', error);
      return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Exception in POST /api/goals:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
