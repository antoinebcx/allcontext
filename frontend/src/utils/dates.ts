import { format, formatDistanceToNow, isToday, isYesterday, isThisYear } from 'date-fns';

export const formatSmartDate = (dateString: string) => {
  const date = new Date(dateString);

  // For recent dates, use relative format
  if (isToday(date)) {
    return format(date, "'Today at' h:mm a");
  }
  if (isYesterday(date)) {
    return format(date, "'Yesterday at' h:mm a");
  }

  // For dates within the last week
  const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (daysAgo < 7) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  // For dates this year
  if (isThisYear(date)) {
    return format(date, 'MMM d, h:mm a');
  }

  // For older dates
  return format(date, 'MMM d, yyyy');
};

export const formatFullDate = (dateString: string) => {
  return format(new Date(dateString), "MMMM d, yyyy 'at' h:mm a");
};
