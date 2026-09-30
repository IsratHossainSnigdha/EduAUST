/*
 * Dates and durations as a reader wants them, shared by the arrangement
 * panels and the session list. They lived beside those components, and a
 * component file that exports anything else loses hot reloading.
 */

/**
 * A date as a reader wants it, not as the API stores it.
 */
export function formatDate(iso) {
  if (!iso) return null;

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * How long the arrangement ran, in the largest unit that is not a lie.
 */
export function describeSpan(fromIso, toIso) {
  if (!fromIso) return null;

  const from = new Date(fromIso);
  const to = toIso ? new Date(toIso) : new Date();

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;

  const days = Math.max(0, Math.floor((to - from) / 86400000));

  if (days < 1) return 'today';
  if (days < 31) return `${days} day${days === 1 ? '' : 's'}`;

  /*
   * Calendar months, not days divided by an average month. Dividing made
   * 23 December to 23 June read as five months rather than six.
   */
  let months =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());

  // The final month has not completed if the day of the month has not come
  // round yet.
  if (to.getDate() < from.getDate()) months -= 1;

  months = Math.max(1, months);

  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;

  const years = Math.floor(months / 12);
  const rest = months % 12;

  return rest === 0
    ? `${years} year${years === 1 ? '' : 's'}`
    : `${years}y ${rest}m`;
}

/**
 * The day and time, written the way somebody would say it.
 */
export function formatWhen(iso) {
  if (!iso) return null;

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * How long it runs for, in hours once that reads better than minutes.
 */
export function formatDuration(minutes) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
