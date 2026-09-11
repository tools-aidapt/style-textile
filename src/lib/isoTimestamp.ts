/**
 * ISO 8601 with the local offset.
 *
 * `toISOString()` would send Z, and every form in this system is submitted in
 * Nairobi — a 09:00 EAT submission filed as 06:00 UTC reads as somebody
 * answering before the email went out.
 *
 * Here rather than in one form's payload module because three of them need
 * it: the feedback layer re-exports it for its own tests, and both KPI forms
 * stamp the same way. One implementation, so a fix reaches every form.
 */
export const localIsoTimestamp = (now: Date = new Date()): string => {
  const pad = (value: number) => String(Math.floor(Math.abs(value))).padStart(2, "0");
  const offset = -now.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";

  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}` +
    `${sign}${pad(offset / 60)}:${pad(offset % 60)}`
  );
};
