/**
 * Streaks calculation utility for daily and weekly habits.
 */

// Helper to format Date to "YYYY-MM-DD" local/UTC ISO date string
export function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get day difference between two YYYY-MM-DD dates
function getDaysDiff(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffTime = Math.abs(d2 - d1);
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

// Helper to get previous date string
function getPrevDateStr(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return formatDate(d);
}

// Helper to get ISO week key e.g. "2026-W35"
function getWeekKey(dateStr) {
  const d = new Date(dateStr);
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNum = 1 + Math.ceil((firstThursday - target) / (7 * 24 * 3600 * 1000));
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Calculates current streak for daily or weekly habits
 * @param {Array<{log_date: string, completed: boolean}>} logs
 * @param {'daily'|'weekly'} frequency
 * @param {Array<number>} targetDays - for weekly habits (e.g. [0, 1, 2, 3, 4, 5, 6] where 0=Sun..6=Sat or 0=Mon..6=Sun)
 * @returns {number}
 */
export function getCurrentStreak(logs = [], frequency = 'daily', targetDays = []) {
  if (!logs || logs.length === 0) return 0;

  // Filter completed logs and map to Set of dates
  const completedDateSet = new Set(
    logs
      .filter((l) => l.completed === true || l.completed === 'true' || l.completed === 1)
      .map((l) => l.log_date?.split('T')[0] || l.log_date)
  );

  if (completedDateSet.size === 0) return 0;

  const todayStr = formatDate(new Date());
  const yesterdayStr = getPrevDateStr(todayStr);

  if (frequency === 'daily') {
    let streak = 0;
    let checkDateStr = todayStr;

    // If today is completed, start from today
    if (completedDateSet.has(todayStr)) {
      streak = 1;
      checkDateStr = yesterdayStr;
    } else if (completedDateSet.has(yesterdayStr)) {
      // If today not completed yet, start from yesterday
      streak = 1;
      checkDateStr = getPrevDateStr(yesterdayStr);
    } else {
      // Neither today nor yesterday completed -> streak is 0
      return 0;
    }

    // Count backwards day-by-day
    while (completedDateSet.has(checkDateStr)) {
      streak++;
      checkDateStr = getPrevDateStr(checkDateStr);
    }

    return streak;
  }

  if (frequency === 'weekly') {
    const requiredDays = Array.isArray(targetDays) && targetDays.length > 0 ? targetDays : [0, 1, 2, 3, 4, 5, 6];

    // Group completed dates by week
    const completedDaysByWeek = {};
    completedDateSet.forEach((dateStr) => {
      const d = new Date(dateStr);
      const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon...
      const weekKey = getWeekKey(dateStr);
      if (!completedDaysByWeek[weekKey]) {
        completedDaysByWeek[weekKey] = new Set();
      }
      completedDaysByWeek[weekKey].add(dayOfWeek);
    });

    const isWeekMet = (weekKey) => {
      const loggedDays = completedDaysByWeek[weekKey] || new Set();
      return requiredDays.every((day) => loggedDays.has(day));
    };

    // Calculate backward week by week
    let streak = 0;
    const currDate = new Date();
    let currWeekKey = getWeekKey(formatDate(currDate));

    // Check current week
    if (isWeekMet(currWeekKey)) {
      streak = 1;
    }

    // Move back week by week
    let checkDate = new Date();
    // Move to previous week
    checkDate.setDate(checkDate.getDate() - 7);
    let prevWeekKey = getWeekKey(formatDate(checkDate));

    if (streak === 0 && isWeekMet(prevWeekKey)) {
      streak = 1;
      checkDate.setDate(checkDate.getDate() - 7);
      prevWeekKey = getWeekKey(formatDate(checkDate));
    }

    if (streak > 0) {
      while (isWeekMet(prevWeekKey)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 7);
        prevWeekKey = getWeekKey(formatDate(checkDate));
      }
    }

    return streak;
  }

  return 0;
}

/**
 * Calculates best/longest streak ever for daily or weekly habits
 * @param {Array<{log_date: string, completed: boolean}>} logs
 * @param {'daily'|'weekly'} frequency
 * @param {Array<number>} targetDays
 * @returns {number}
 */
export function getBestStreak(logs = [], frequency = 'daily', targetDays = []) {
  if (!logs || logs.length === 0) return 0;

  const completedDates = Array.from(
    new Set(
      logs
        .filter((l) => l.completed === true || l.completed === 'true' || l.completed === 1)
        .map((l) => l.log_date?.split('T')[0] || l.log_date)
    )
  ).sort();

  if (completedDates.length === 0) return 0;

  if (frequency === 'daily') {
    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < completedDates.length; i++) {
      const prev = new Date(completedDates[i - 1]);
      const curr = new Date(completedDates[i]);
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }

    return maxStreak;
  }

  if (frequency === 'weekly') {
    const current = getCurrentStreak(logs, frequency, targetDays);
    return Math.max(current, 1);
  }

  return 0;
}
