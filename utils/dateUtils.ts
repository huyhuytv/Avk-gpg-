// src/utils/dateUtils.ts
import { WorldDate } from '../types';

/**
 * Parses a duration string (e.g., "10 ngày", "2 tháng") into a total number of days.
 * @param durationStr The string to parse.
 * @returns An object containing the total number of days.
 */
export const parseDurationString = (durationStr: string): { days: number } => {
    let totalDays = 0;
    const parts = durationStr.toLowerCase().split(/[\s,]+/);

    for (let i = 0; i < parts.length - 1; i++) {
        const value = parseInt(parts[i], 10);
        if (!isNaN(value)) {
            const unit = parts[i + 1];
            if (unit.startsWith('ngày')) {
                totalDays += value;
            } else if (unit.startsWith('tháng')) {
                totalDays += value * 30;
            } else if (unit.startsWith('năm')) {
                totalDays += value * 360;
            }
        }
    }
    return { days: totalDays };
};

/**
 * Adds a specified number of days to a WorldDate object, handling month and year overflows.
 * @param date The starting WorldDate.
 * @param daysToAdd The number of days to add.
 * @returns The new WorldDate object.
 */
export const addDaysToWorldDate = (date: WorldDate, daysToAdd: number): WorldDate => {
    const newDate = { ...date };
    newDate.day += daysToAdd;

    while (newDate.day > 30) {
        newDate.day -= 30;
        newDate.month += 1;
        if (newDate.month > 12) {
            newDate.month = 1;
            newDate.year += 1;
        }
    }
    return newDate;
};


/**
 * Converts a WorldDate to a total number of days since year 0, month 0, day 0 for calculations.
 * This function is now exported for wider use.
 * @param date The WorldDate to convert.
 * @returns The total number of days.
 */
export const worldDateToTotalDays = (date: WorldDate): number => {
    return (date.year * 360) + ((date.month - 1) * 30) + date.day;
};

/**
 * Calculates the difference in days between two WorldDate objects.
 * This function is now exported for wider use.
 * @param date1 The first date.
 * @param date2 The second date.
 * @returns The absolute difference in days.
 */
export const daysBetween = (date1: WorldDate, date2: WorldDate): number => {
    return Math.abs(worldDateToTotalDays(date1) - worldDateToTotalDays(date2));
};

/**
 * Generates a human-readable string describing the time difference for an event relative to the current date.
 * @param startDate The event's start date.
 * @param endDate The event's end date.
 * @param currentDate The current game date.
 * @returns A formatted string (e.g., "Sắp diễn ra trong X ngày", "Đang diễn ra, còn Y ngày").
 */
export const getWorldDateDifferenceString = (startDate: WorldDate, endDate: WorldDate, currentDate: WorldDate): string => {
    const totalDaysStart = worldDateToTotalDays(startDate);
    const totalDaysEnd = worldDateToTotalDays(endDate);
    const totalDaysCurrent = worldDateToTotalDays(currentDate);

    if (totalDaysCurrent < totalDaysStart) {
        const daysUntil = daysBetween(currentDate, startDate);
        return `Bắt đầu sau ${daysUntil} ngày`;
    } else if (totalDaysCurrent >= totalDaysStart && totalDaysCurrent <= totalDaysEnd) {
        const daysRemaining = daysBetween(currentDate, endDate);
        return `Kết thúc sau ${daysRemaining} ngày`;
    } else { // totalDaysCurrent > totalDaysEnd
        const daysAgo = daysBetween(currentDate, endDate);
        return `Đã kết thúc ${daysAgo} ngày trước`;
    }
};

/**
 * Formats a WorldDate object into a readable string.
 * @param date The WorldDate object.
 * @returns A formatted string e.g., "Ngày 1, T1, N1 - 08:00".
 */
export const formatWorldDateToString = (date: WorldDate): string => {
  if (!date) return 'Không rõ';
  const hour = String(date.hour).padStart(2, '0');
  const minute = String(date.minute).padStart(2, '0');
  return `Ngày ${date.day}, T${date.month}, N${date.year} - ${hour}:${minute}`;
};
