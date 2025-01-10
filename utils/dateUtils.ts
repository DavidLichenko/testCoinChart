export function getForexDateRange(interval: string): { start_date: string; end_date: string } {
  const now = new Date();

  // Get current UTC time
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();
  const currentDate = now.getUTCDate();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();

  // Create end date in UTC (yesterday)
  const end = new Date(Date.UTC(
      currentYear,
      currentMonth,
      currentDate - 1,
      currentHour,
      currentMinute
  ));

  let start = new Date(end);

  if (interval === 'minute') {
    // For minute data, get exactly one hour before current UTC time
    start.setUTCHours(end.getUTCHours() - 1);
  } else if (interval === 'hourly') {
    // For hourly data, get one month minus one day
    start.setUTCMonth(end.getUTCMonth() - 1);
    start.setUTCDate(end.getUTCDate() + 1);
  } else {
    // For daily data, get last year
    start.setUTCFullYear(end.getUTCFullYear() - 1);
    start.setUTCDate(end.getUTCDate() + 1);
  }

  // Format dates
  const formatDate = (date: Date, includeTime: boolean = false) => {
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    if (includeTime) {
      const hh = String(date.getUTCHours()).padStart(2, '0');
      const min = String(date.getUTCMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    }
    return `${yyyy}-${mm}-${dd}`;
  };

  // Include time for minute interval
  const includeTime = interval === 'minute';

  return {
    start_date: formatDate(start, includeTime),
    end_date: formatDate(end, includeTime)
  };
}

export function isForexMarketOpen(): boolean {
  const now = new Date();
  const day = now.getUTCDay();
  const hours = now.getUTCHours();

  // Market is closed on weekends (Saturday = 6, Sunday = 0)
  if (day === 6 || day === 0) {
    return false;
  }

  // Market is open from Sunday 5 PM ET (21:00 UTC) to Friday 5 PM ET (21:00 UTC)
  if (day === 5 && hours >= 21) {
    return false;
  }

  return true;
}
