/**
 * TEMPORARY experiment (Amjad): make Most Popular the default landing
 * so bounce-rate can be checked against a clear path.
 *
 * `/` and `/en` 308 to the Most Popular URLs when this is true.
 * Chip highlight + ranked list first already live on that destination (#99).
 *
 * Revert: set to `false` (or delete the two redirects in next.config.ts).
 * Do not leave this on after the check. Hold merge until Amjad tries.
 */
export const TEMPORARY_DEFAULT_LANDING_MOST_POPULAR = true;
