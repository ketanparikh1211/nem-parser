const fs = require('fs');
const readline = require('readline');

const inputFile = 'data/input_nem12.csv';
const outputFile = 'data/output.sql';

// Configuration
const BATCH_SIZE = 10; // Number of records to process before flushing to SQL
const MAX_FILE_SIZE_MB = 500; // Maximum file size in MB
// Configure maximum SQL insert chunk size
const SQL_CHUNK_SIZE = 10; // Maximum number of values in a single INSERT statement

// Check file size before processing
try {
  const stats = fs.statSync(inputFile);
  const fileSizeMB = stats.size / (1024 * 1024);
  console.log(`Input file size: ${fileSizeMB.toFixed(2)} MB`);
  
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    console.warn(`⚠️ Warning: File size (${fileSizeMB.toFixed(2)} MB) exceeds recommended maximum (${MAX_FILE_SIZE_MB} MB).`);
    console.log('Processing will continue but may require additional memory.');
  }
} catch (err) {
  console.error(`❌ Error checking file size: ${err.message}`);
  process.exit(1);
}

const rl = readline.createInterface({
  input: fs.createReadStream(inputFile),
  crlfDelay: Infinity
});

const output = fs.createWriteStream(outputFile, { flags: 'w' });

let currentNMI = null;
let intervalLength = 0;
let current300 = null;
let hasHeader = false;
let hasFooter = false;
let pendingIntervals = [];
let totalRecordsProcessed = 0;
let startTime = Date.now();

/**
 * Processes the 300 block of data.
  * This block contains interval data for a specific NMI.
  * It extracts the date, values, quality, and reason, and prepares them for SQL output.
  * If the quality is not valid ('V'), it converts the values to numbers and stores them in pendingIntervals.
  *
 * @param {*} parts 
 */
function process300(parts) {
  current300 = {
    date: parts[1],
    values: parts.slice(2, 50),
    quality: parts[50],
    reason: parts[51]
  };

  if (current300.quality !== 'V') {
    current300.values.forEach((val, i) => {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        pendingIntervals.push({
          nmi: currentNMI,
          timestamp: getTimestamp(current300.date, i, intervalLength),
          value: num
        });
      }
    });
  }
}

/**
 * Processes the 400 block of data.
 * @param {*} parts 
 */
function process400(parts) {
  const start = parseInt(parts[1], 10) - 1;
  const end = parseInt(parts[2], 10) - 1;

  for (let i = start; i <= end; i++) {
    const val = current300.values[i];
    const num = parseFloat(val);
    if (!isNaN(num)) {
      pendingIntervals.push({
        nmi: currentNMI,
        timestamp: getTimestamp(current300.date, i, intervalLength),
        value: num
      });
    }
  }
}

/**
 * Flushes pending intervals to the SQL output file.
 * @returns {void}
 */
function flushPending() {
  if (pendingIntervals.length === 0) return;

  try {
    // Process in chunks to avoid excessively large SQL statements
    for (let i = 0; i < pendingIntervals.length; i += SQL_CHUNK_SIZE) {
      const chunk = pendingIntervals.slice(i, i + SQL_CHUNK_SIZE);
      
      const sql = `INSERT INTO meter_readings (nmi, timestamp, consumption) VALUES\n` +
        chunk.map(i =>
          `('${i.nmi}', '${i.timestamp}', ${i.value})`
        ).join(',\n') + ';\n\n';

      output.write(sql);
    }
    
    totalRecordsProcessed += pendingIntervals.length;
    pendingIntervals = [];
  } catch (err) {
    console.error(`❌ Error writing to SQL file: ${err.message}`);
  }
}

/**
 * Returns a timestamp (UTC) string based on the date string, interval index, and interval length.
 * @param {*} dateStr 
 * @param {*} intervalIndex 
 * @param {*} intervalLength 
 * @returns {string} The formatted timestamp.
 */
function getTimestamp(dateStr, intervalIndex, intervalLength) {
  const base = new Date(
    parseInt(dateStr.slice(0, 4), 10),
    parseInt(dateStr.slice(4, 6), 10) - 1,
    parseInt(dateStr.slice(6, 8), 10),
    0, 0, 0
  );
  base.setMinutes(base.getMinutes() + intervalIndex * intervalLength);
  return base.toISOString().replace('T', ' ').slice(0, 19);
}

let lineCount = 0;

rl.on('line', (line) => {
  try {
    lineCount++;
    // Log progress for large files
    if (lineCount % 100000 === 0) {
      const elapsedSecs = (Date.now() - startTime) / 1000;
      console.log(`Processing line ${lineCount}, ${totalRecordsProcessed} records written (${elapsedSecs.toFixed(1)}s elapsed)`);
    }
    
    const parts = line.trim().split(',');
    switch (parts[0]) {
      case '100':
        hasHeader = true;
        break;
      case '200':
        currentNMI = parts[1];
        intervalLength = parseInt(parts[8], 10);
        break;
      case '300':
        process300(parts);
        break;
      case '400':
        process400(parts);
        break;
      case '500':
        console.log(`Info: Skipped 500 block -> ${line}`);
        break;
      case '900':
        hasFooter = true;
        flushPending();
        break;
      default:
        console.log(`Warning: Unrecognized line -> ${line}`);
    }
    
    // Batch processing to avoid memory issues with large files
    if (pendingIntervals.length >= BATCH_SIZE) {
      flushPending();
    }
  } catch (err) {
    console.error(`❌ Error processing line ${lineCount}: ${err.message}`);
    console.error(`Line content: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
  }
});

rl.on('close', () => {
  try {
    flushPending();
    output.end();
    
    const elapsedSecs = (Date.now() - startTime) / 1000;
    
    if (!hasHeader) {
      console.error('❌ Error: Missing 100 header record.');
    }
    if (!hasFooter) {
      console.error('❌ Error: Missing 900 footer record.');
    }

    if (hasHeader && hasFooter) {
      console.log(`✅ Parsing complete in ${elapsedSecs.toFixed(2)}s.`);
      console.log(`Processed ${lineCount} lines, generated ${totalRecordsProcessed} SQL records.`);
      console.log(`SQL file generated at ${outputFile}`);
    } else {
      console.error('❌ File validation failed. Aborting.');
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ Error finalizing processing: ${err.message}`);
    process.exit(1);
  }
});

// Add error handler for the readline interface
rl.on('error', (err) => {
  console.error(`❌ Error reading input file: ${err.message}`);
  process.exit(1);
});

// Add error handler for the output stream
output.on('error', (err) => {
  console.error(`❌ Error writing to SQL file: ${err.message}`);
  process.exit(1);
});
