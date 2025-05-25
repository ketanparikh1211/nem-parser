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
