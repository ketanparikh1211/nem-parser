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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📊 Tech Assessment Q&A

### Q1. What is the rationale for the technologies you have decided to use?

- **Node.js**: Chosen for its efficient non-blocking I/O operations and streaming capabilities, which are ideal for processing large files
- **Built-in modules**: Using core `fs` and `readline` modules instead of third-party libraries to minimize dependencies
- **Streaming approach**: Enables processing of very large files with minimal memory overhead
- **Batch processing**: Optimizes memory usage and database performance by generating SQL in manageable chunks

### Q2. What would you have done differently if you had more time?

- Implement more thorough validation of NEM12 file format
- Add unit and integration tests
- Create configurable options via CLI arguments 
- Add support for different output formats (e.g., CSV, JSON)
- Implement parallel processing for multi-core systems
- Add more detailed logging and monitoring
- Create a web interface for file uploads and processing

### Q3. What is the rationale for the design choices that you have made?

- **Line-by-line processing**: Ensures memory efficiency even with files of arbitrary size
- **Batch processing**: Balances memory usage and database performance
- **Error handling**: Provides detailed error information for troubleshooting
- **Progress reporting**: Gives visibility into processing status for large files
- **Configurability**: Allows tuning for different file sizes and system capabilities
- **Separation of concerns**: Clear functions for processing different record types