/**
 * Lunar calendar conversion utilities.
 * Uses a simplified lookup approach for Vietnamese lunar calendar.
 *
 * For a production app, use a dedicated library like `vietnamese-lunar-calendar`
 * or a complete lookup table for accurate conversions.
 */

// Placeholder: In production, integrate a proper lunar calendar library
export interface LunarDate {
  day: number;
  month: number;
  year: number;
  isLeapMonth: boolean;
}

/**
 * Convert a solar (Gregorian) date to lunar date.
 * This is a simplified placeholder. Use a proper conversion library in production.
 */
export function solarToLunar(
  solarYear: number,
  solarMonth: number,
  solarDay: number
): LunarDate {
  // TODO: Integrate proper lunar calendar conversion
  // For now, return the solar date as-is (placeholder)
  return {
    day: solarDay,
    month: solarMonth,
    year: solarYear,
    isLeapMonth: false,
  };
}

/**
 * Convert a lunar date to solar (Gregorian) date.
 * This is a simplified placeholder.
 */
export function lunarToSolar(lunar: LunarDate): Date {
  // TODO: Integrate proper lunar calendar conversion
  return new Date(lunar.year, lunar.month - 1, lunar.day);
}

/**
 * Format a lunar date as a string for display.
 */
export function formatLunarDate(lunar: LunarDate): string {
  const leapPrefix = lunar.isLeapMonth ? " (nhuận)" : "";
  return `${lunar.day}/${lunar.month}${leapPrefix}/${lunar.year} ÂL`;
}
