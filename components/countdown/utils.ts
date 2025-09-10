import dayjs, { Dayjs } from "dayjs";

export type TimeDiff = {
  seconds: string;
  minutes: string;
  hours: string;
  days: string;
};

/**
 * Calculate the remaining time between now and a future timestamp.
 * If the timestamp is in the past, returns all "00".
 */
export function calculateDiff(timeInMs: number): TimeDiff {
  const timestampDayjs = dayjs(timeInMs);
  const nowDayjs = dayjs();

  if (timestampDayjs.isBefore(nowDayjs)) {
    return { seconds: "00", minutes: "00", hours: "00", days: "00" };
  }

  return {
    seconds: getRemainingSeconds(nowDayjs, timestampDayjs),
    minutes: getRemainingMinutes(nowDayjs, timestampDayjs),
    hours: getRemainingHours(nowDayjs, timestampDayjs),
    days: getRemainingDays(nowDayjs, timestampDayjs),
  };
}

function getRemainingSeconds(now: Dayjs, target: Dayjs): string {
  const seconds = target.diff(now, "seconds") % 60;
  return padWithZeros(seconds, 2);
}

function getRemainingMinutes(now: Dayjs, target: Dayjs): string {
  const minutes = target.diff(now, "minutes") % 60;
  return padWithZeros(minutes, 2);
}

function getRemainingHours(now: Dayjs, target: Dayjs): string {
  const hours = target.diff(now, "hours") % 24; // fixed: hours should wrap at 24
  return padWithZeros(hours, 2);
}

function getRemainingDays(now: Dayjs, target: Dayjs): string {
  const days = target.diff(now, "days");
  return days.toString();
}

function padWithZeros(value: number, length: number): string {
  const str = value.toString();
  return str.length >= length ? str : "0".repeat(length - str.length) + str;
}