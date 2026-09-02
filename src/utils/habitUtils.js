// Helper to get YYYY-MM-DD in local time
export function getLocalDateStr(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Calculate current streak based on an array of completed YYYY-MM-DD dates and frozenDates
export function calculateStreak(completedDates, initialStreak = 0, createdAtDate = null, frozenDates = []) {
  const todayStr = getLocalDateStr(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getLocalDateStr(yesterdayDate);

  const compDates = completedDates || [];
  const frozDates = [...(frozenDates || [])];
  
  if (compDates.length === 0 && frozDates.length === 0) {
    if (createdAtDate && createdAtDate !== todayStr && createdAtDate !== yesterdayStr) {
      // If created before yesterday and never completed, streak is broken
      return 0;
    }
    return initialStreak;
  }
  
  // Combine and sort dates descending (newest first)
  const allActiveDates = Array.from(new Set([...compDates, ...frozDates]));
  const sortedDates = allActiveDates.sort((a, b) => new Date(b) - new Date(a));
  
  // If latest activity is neither today nor yesterday, streak is broken
  if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterdayStr) {
    return 0;
  }

  let currentStreak = 0;
  const [y, m, d] = sortedDates[0].split('-').map(Number);
  let checkDate = new Date(y, m - 1, d, 0, 0, 0, 0);
  
  for (let i = 0; i < sortedDates.length; i++) {
    const dStr = getLocalDateStr(checkDate);
    if (sortedDates[i] === dStr) {
      if (compDates.includes(dStr)) {
        currentStreak++; // Only actual completions increment the streak number
      }
      checkDate.setDate(checkDate.getDate() - 1); // Move back one day
    } else {
      break; // Gap found
    }
  }
  
  return currentStreak + initialStreak;
}

// Get array of last 7 days for the dashboard
export function getLast7Days(locale = 'tr-TR') {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      dateStr: getLocalDateStr(d),
      // Short weekday name
      dayName: d.toLocaleDateString(locale, { weekday: 'short' })
    });
  }
  return days;
}

export function isItemDay(item, targetDateObj) {
  if (item.freqType === 'instant') {
    return item.createdAtDate === getLocalDateStr(targetDateObj);
  }
  if (item.freqType === 'daily') return true;
  if (item.freqType === 'weekly') {
    const jsDay = targetDateObj.getDay();
    const myDay = jsDay === 0 ? 7 : jsDay;
    return (item.freqValues || []).includes(myDay);
  }
  if (item.freqType === 'monthly') {
    const date = targetDateObj.getDate();
    return (item.freqValues || []).includes(date);
  }
  if (item.freqType === 'yearly') {
    const month = targetDateObj.getMonth() + 1;
    return (item.freqValues || []).includes(month);
  }
  return true;
}

export function isItemAvailable(item, targetDateObj) {
  if (!isItemDay(item, targetDateObj)) return false;
  if (!item.time) return true;

  const targetStr = getLocalDateStr(targetDateObj);
  if ((item.completedDates || []).includes(targetStr)) return true;

  const now = new Date();
  const nowStr = getLocalDateStr(now);
  
  if (targetStr < nowStr) return true; 
  if (targetStr > nowStr) return false; 
  
  const [hours, minutes] = item.time.split(':').map(Number);
  if (now.getHours() > hours) return true;
  if (now.getHours() === hours && now.getMinutes() >= minutes) return true;
  
  return false;
}

export function calculateMaxStreakForHabit(completedDates, initialStreak = 0, createdAtDate = null) {
  const compDates = completedDates || [];
  if (compDates.length === 0) return initialStreak;

  const sortedDates = Array.from(new Set(compDates)).sort((a, b) => new Date(b) - new Date(a));
  
  let maxStreak = 0;
  let currentStreak = 1;

  for (let i = 0; i < sortedDates.length - 1; i++) {
    const [y1, m1, d1] = sortedDates[i].split('-').map(Number);
    const [y2, m2, d2] = sortedDates[i + 1].split('-').map(Number);
    
    const date1 = new Date(y1, m1 - 1, d1);
    const date2 = new Date(y2, m2 - 1, d2);
    
    const diffTime = Math.abs(date1 - date2);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays === 1) {
      currentStreak++;
    } else {
      if (currentStreak > maxStreak) maxStreak = currentStreak;
      currentStreak = 1;
    }
  }
  if (currentStreak > maxStreak) maxStreak = currentStreak;

  const currentTotalStreak = calculateStreak(compDates, initialStreak, createdAtDate);
  return Math.max(maxStreak, currentTotalStreak, initialStreak);
}
