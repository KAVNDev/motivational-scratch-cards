/**
 * App-level configuration.
 * Edit senderName / recipientName to personalise the cards.
 * Leave them as empty strings to hide those lines entirely.
 *
 * epochDate is a fixed reference date used for the deterministic
 * message picker — it must stay constant in production so that every
 * user sees the same card on the same day.
 */

export const senderName = '';
export const recipientName = '';

/** Fixed reference epoch for the day-index calculation. */
export const epochDate = '2024-01-01';
