const moment = require("moment-timezone");

/**
 * Convert local time to UTC.
 */
function toUTC(localTime, timeZone) {
  return moment.tz(localTime, timeZone).utc().toISOString();
}

/**
 * Convert UTC time to a specific time zone.
 */
function toLocal(utcTime, timeZone) {
  return moment.utc(utcTime).tz(timeZone).format("YYYY-MM-DD HH:mm:ss");
}

/**
 * Get the current time in a specific time zone.
 */
function nowInTimeZone(timeZone) {
  return moment().tz(timeZone).toDate();
}

/**
 * Validate if a provided time zone is valid.
 */
function isValidTimeZone(timeZone) {
  return !!moment.tz.zone(timeZone);
}

module.exports = { toUTC, toLocal, nowInTimeZone, isValidTimeZone };
