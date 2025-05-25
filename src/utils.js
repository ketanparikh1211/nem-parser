/**
 * NEM12 Parser Utility Functions
 */

/**
 * Returns a timestamp (UTC) string based on the date string, interval index, and interval length.
 * @param {string} dateStr The date in YYYYMMDD format
 * @param {number} intervalIndex The index of the interval in the day
 * @param {number} intervalLength The length of the interval in minutes
 * @returns {string} The formatted timestamp.
 */
function getTimestamp(dateStr, intervalIndex, intervalLength) {
  try {
    // Parse the date string safely
    const year = parseInt(dateStr.slice(0, 4), 10);
    const month = parseInt(dateStr.slice(4, 6), 10) - 1;
    const day = parseInt(dateStr.slice(6, 8), 10);
    
    // Check if any of the date components are NaN
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return 'Invalid-date-NaN';
    }
    
    // Create date object with local timezone
    const base = new Date(year, month, day, 0, 0, 0);
    
    // Add interval time
    base.setMinutes(base.getMinutes() + intervalIndex * intervalLength);
    
    // Format to YYYY-MM-DD HH:MM:SS
    const pad = (num) => String(num).padStart(2, '0');
    
    return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())} ${pad(base.getHours())}:${pad(base.getMinutes())}:${pad(base.getSeconds())}`;
  } catch (err) {
    return `Invalid-date-${err.message}`;
  }
}

/**
 * Parses a 300 record line into an object with date, values, quality, and reason
 * @param {string[]} parts The split line parts
 * @returns {Object} The parsed 300 record
 */
function parse300Record(parts) {
  return {
    date: parts[1],
    values: parts.slice(2, 50),
    quality: parts[50],
    reason: parts[51]
  };
}

/**
 * Creates a SQL insert statement for meter readings
 * @param {Array} intervals Array of interval objects with nmi, timestamp, and value 
 * @param {number} chunkSize Maximum number of values in a single INSERT statement
 * @returns {string} The SQL insert statement
 */
function createSqlInsert(intervals, chunkSize = 10) {
  if (intervals.length === 0) return '';
  
  let sql = '';
  
  // Process in chunks
  for (let i = 0; i < intervals.length; i += chunkSize) {
    const chunk = intervals.slice(i, i + chunkSize);
    
    sql += `INSERT INTO meter_readings (nmi, timestamp, consumption) VALUES\n` +
      chunk.map(interval =>
        `('${interval.nmi}', '${interval.timestamp}', ${interval.value})`
      ).join(',\n') + ';\n\n';
  }
  
  return sql;
}

/**
 * Validates a NEM12 header record (100)
 * @param {string[]} parts The split line parts
 * @returns {boolean} True if valid, false otherwise
 */
function validateHeaderRecord(parts) {
  return parts[0] === '100' && parts.length >= 1;
}

/**
 * Validates a NEM12 footer record (900)
 * @param {string[]} parts The split line parts
 * @returns {boolean} True if valid, false otherwise
 */
function validateFooterRecord(parts) {
  return parts[0] === '900' && parts.length >= 1;
}

/**
 * Parses a NEM12 200 record into an object
 * @param {string[]} parts The split line parts
 * @returns {Object} The parsed 200 record with nmi and intervalLength
 */
function parse200Record(parts) {
  return {
    nmi: parts[1],
    intervalLength: parseInt(parts[8], 10)
  };
}

module.exports = {
  getTimestamp,
  parse300Record,
  createSqlInsert,
  validateHeaderRecord,
  validateFooterRecord,
  parse200Record
};