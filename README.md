# NEM12 Parser

A high-performance Node.js utility for converting NEM12 format files to SQL insert statements.

## 📋 Overview

This utility reads NEM12 (National Electricity Market) interval meter data files and converts them into SQL insert statements for database ingestion. It handles large file sizes efficiently by using streaming and batch processing techniques.

## ✨ Features

- **Streaming Processing**: Handles files of arbitrary size without loading the entire content into memory
- **Batch Processing**: Processes data in configurable batches to optimize memory usage
- **Error Handling**: Robust error reporting for malformed input files
- **Input Validation**: Validates header and footer records for data integrity
- **Performance Monitoring**: Reports on processing time and record counts

## 🚀 Installation

```bash
npm install
```

## 🔧 Usage

```bash
npm start
```

Or with custom input/output files:

```bash
node src/index.js --input ./path/to/input.csv --output ./path/to/output.sql
```

## ⚙️ Configuration

The following configuration options are available in `src/index.js`:

- `BATCH_SIZE`: Number of records to process before flushing to SQL (default: 10)
- `MAX_FILE_SIZE_MB`: Maximum file size warning threshold in MB (default: 500)
- `SQL_CHUNK_SIZE`: Maximum number of values in a single INSERT statement (default: 10)

## 📝 Input Format

The parser expects NEM12 format files with the following structure:

- `100` record: File header
- `200` record: NMI data header
- `300` record: Interval data
- `400` record: Interval event record (optional)
- `500` record: B2B details record (skipped)
- `900` record: File footer

## 📤 Output Format

The parser generates SQL insert statements for the `meter_readings` table with the following columns:

- `nmi`: National Meter Identifier
- `timestamp`: Timestamp for the reading
- `consumption`: Consumption value for the interval

## 🧐 Technical Design Rationale

### Memory Efficiency

- Uses Node.js streams to process large files line-by-line without loading the entire file
- Implements batch processing to flush SQL statements periodically
- Configurable chunk size for SQL INSERT statements

### Error Handling

- Validates file header (100) and footer (900) records
- Reports detailed information about processing errors
- Logs progress for large files

## 🧪 Testing

### Running Tests

```bash
npm test
```

### Test Coverage

To generate test coverage reports:

```bash
npm run test:coverage
```

Tests are organized in the following categories:

- **Unit Tests**: Tests for individual functions and components
- **Integration Tests**: Tests for interactions between components
- **Validation Tests**: Tests for input validation and error handling
- **Performance Tests**: Tests for performance benchmarks

### Adding Tests

New tests should be added in the `test` directory following the naming convention:
- Unit tests: `*.test.js`
- Integration tests: `*.integration.test.js`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 Technical Decisions and Rationale

### Q1: What is the rationale for the technologies you have decided to use?

The NEM12 parser project uses Node.js with the following rationale:

1. **Stream Processing**: Node.js has built-in stream capabilities (`readline`, `fs`) that allow processing large files line by line without loading the entire file into memory, ideal for potentially large NEM12 files.

2. **Event-driven Architecture**: The non-blocking I/O model in Node.js efficiently handles file reading and writing operations concurrently, improving performance for I/O-intensive tasks like file parsing.

3. **JavaScript Ecosystem**: JavaScript provides rich data manipulation capabilities needed for transforming CSV data to SQL, with easy string manipulation and decent number handling.

4. **Low Overhead**: The solution requires minimal third-party dependencies (only `yargs` for command-line argument parsing), reducing security risks and simplifying deployment.

5. **Testing Framework**: Jest provides a comprehensive testing framework that allows for unit, integration, and coverage testing, ensuring code reliability.

### Q2: What would you have done differently if you had more time?

With more time, several improvements could be made:

1. **Cloud Storage Integration**: Store CSV files in S3 or similar cloud storage and stream directly from there for better scalability and reliability.

2. **Database Layer**: Add direct database connection instead of generating SQL files, allowing for immediate data loading and validation.

3. **Better Error Recovery**: Implement more sophisticated error recovery mechanisms to continue processing after encountering malformed records.

4. **Performance Optimization**: Profile the code to identify bottlenecks and optimize core parsing functions.

5. **Schema Validation**: Add validation against a database schema to ensure data integrity before writing.

6. **Parallel Processing**: Implement worker threads for parallel processing of large files divided into chunks.


### Q3: What is the rationale for the design choices that you have made?

The design choices focus on reliability, efficiency, and maintainability:

1. **Batching and Periodic Flush**: Processing data in configurable batches (via `BATCH_SIZE` and `SQL_CHUNK_SIZE`) prevents memory overflow and provides consistent performance regardless of file size.

2. **Node.js Single-threaded Model**: Leverages Node.js's efficient garbage collection and event loop to avoid thread blocking on I/O operations. The single-threaded model with non-blocking I/O is perfect for this kind of I/O-bound task.

3. **Stream Processing**: Line-by-line processing with `readline` interface allows handling arbitrarily large files without memory constraints.

4. **Modular Functions**: The code separates concerns into discrete functions (`process300`, `process400`, `flushPending`, etc.) improving readability and testability.

5. **Robust Error Handling**: Comprehensive error handling at multiple levels ensures that the process fails gracefully with informative messages.

6. **Progress Reporting**: Regular progress updates for large files helps monitor long-running processes.

7. **Configuration Variables**: Key parameters are defined as constants at the top of the file, making it easy to tune performance without modifying core logic.

8. **Validation Checks**: The system validates header and footer records to ensure data integrity and complete processing.
