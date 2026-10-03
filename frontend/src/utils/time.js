// Shared IST (Asia/Kolkata) date helpers.
// Exam times are stored in UTC; admins enter and students read them in IST.

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/** datetime-local value (treated as IST) → UTC ISO string for the API. */
export const localToIST_ISO = (localStr) => {
  if (!localStr) return "";
  const [datePart, timePart] = localStr.split("T");
  const [year, month, day]   = datePart.split("-").map(Number);
  const [hour, minute]       = timePart.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - IST_OFFSET_MS).toISOString();
};

/** UTC ISO string → datetime-local value in IST (for pre-filling inputs). */
export const isoToLocalInput = (isoString) => {
  if (!isoString) return "";
  const ist = new Date(new Date(isoString).getTime() + IST_OFFSET_MS);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}` +
    `T${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`
  );
};

const fmt = (isoString, opts, fallback = "—") => {
  if (!isoString) return fallback;
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", ...opts });
};

/** "09 Apr 2025, 04:50 pm IST" */
export const formatIST = (iso, fallback = "—") =>
  iso ? `${fmt(iso, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })} IST` : fallback;

/** "09 Apr 2025" */
export const formatDateIST = (iso) => fmt(iso, { day: "2-digit", month: "short", year: "numeric" });

/** "09 Apr, 04:50 pm" */
export const formatDateTimeShortIST = (iso) =>
  fmt(iso, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });

/** "04:50 pm" */
export const formatTimeIST = (iso) => fmt(iso, { hour: "2-digit", minute: "2-digit", hour12: true });

/** "Wed, 09 Apr, 04:50 pm" */
export const formatWeekdayIST = (iso) =>
  fmt(iso, { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });

export const isTodayIST = (iso) => {
  if (!iso) return false;
  const day = (d) => d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
  return day(new Date(iso)) === day(new Date());
};
