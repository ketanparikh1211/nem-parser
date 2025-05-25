const {
  getTimestamp,
  parse300Record,
  createSqlInsert,
  validateHeaderRecord,
  validateFooterRecord,
  parse200Record
} = require('../src/utils');

describe('NEM12 Parser Utilities', () => {
  describe('getTimestamp', () => {
    test('should convert date string and interval to timestamp', () => {
      // Using date: 20230101, interval index: 0, length: 30 min
      expect(getTimestamp('20230101', 0, 30)).toBe('2023-01-01 00:00:00');
      
      // Using date: 20230101, interval index: 1, length: 30 min = 00:30:00
      expect(getTimestamp('20230101', 1, 30)).toBe('2023-01-01 00:30:00');
      
      // Using date: 20230101, interval index: 2, length: 30 min = 01:00:00
      expect(getTimestamp('20230101', 2, 30)).toBe('2023-01-01 01:00:00');
      
      // Using date: 20230101, interval index: 24, length: 30 min = 12:00:00
      expect(getTimestamp('20230101', 24, 30)).toBe('2023-01-01 12:00:00');
    });

    test('should handle different interval lengths', () => {
      // 15-minute interval
      expect(getTimestamp('20230101', 1, 15)).toBe('2023-01-01 00:15:00');
      
      // 60-minute interval
      expect(getTimestamp('20230101', 1, 60)).toBe('2023-01-01 01:00:00');
    });

    test('should handle date transitions', () => {
      // Last interval of the day (23:30 with 30-min intervals)
      expect(getTimestamp('20230101', 47, 30)).toBe('2023-01-01 23:30:00');
    });
  });

  describe('parse300Record', () => {
    test('should correctly parse a 300 record', () => {
      const mockParts = [
        '300',                  // Record identifier
        '20230101',             // Date
        ...Array(48).fill('1'), // 48 values
        'V',                    // Quality flag
        'A'                     // Reason code
      ];
      
      const result = parse300Record(mockParts);
      
      expect(result).toEqual({
        date: '20230101',
        values: Array(48).fill('1'),
        quality: 'V',
        reason: 'A'
      });
    });
  });

  describe('createSqlInsert', () => {
    test('should return empty string for empty intervals', () => {
      expect(createSqlInsert([])).toBe('');
    });

    test('should create SQL insert statements with correct format', () => {
      const intervals = [
        { nmi: 'NMI001', timestamp: '2023-01-01 00:00:00', value: 10.5 },
        { nmi: 'NMI001', timestamp: '2023-01-01 00:30:00', value: 11.2 }
      ];
      
      const expectedSql = 
        "INSERT INTO meter_readings (nmi, timestamp, consumption) VALUES\n" +
        "('NMI001', '2023-01-01 00:00:00', 10.5),\n" +
        "('NMI001', '2023-01-01 00:30:00', 11.2);\n\n";
      
      expect(createSqlInsert(intervals)).toBe(expectedSql);
    });

    test('should split into chunks based on the provided chunk size', () => {
      const intervals = Array(25).fill().map((_, i) => ({
        nmi: 'NMI001',
        timestamp: `2023-01-01 ${String(Math.floor(i/2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}:00`,
        value: i + 10
      }));
      
      const result = createSqlInsert(intervals, 5);
      
      // Check that we have 5 SQL statements (25 records / 5 chunk size = 5 statements)
      const insertCount = (result.match(/INSERT INTO/g) || []).length;
      expect(insertCount).toBe(5);
    });
  });

  describe('validateHeaderRecord', () => {
    test('should validate correct header record', () => {
      expect(validateHeaderRecord(['100'])).toBe(true);
      expect(validateHeaderRecord(['100', 'NEM12', '200'])).toBe(true);
    });

    test('should reject incorrect header records', () => {
      expect(validateHeaderRecord(['200'])).toBe(false);
      expect(validateHeaderRecord([])).toBe(false);
    });
  });

  describe('validateFooterRecord', () => {
    test('should validate correct footer record', () => {
      expect(validateFooterRecord(['900'])).toBe(true);
      expect(validateFooterRecord(['900', 'End of File'])).toBe(true);
    });

    test('should reject incorrect footer records', () => {
      expect(validateFooterRecord(['800'])).toBe(false);
      expect(validateFooterRecord([])).toBe(false);
    });
  });

  describe('parse200Record', () => {
    test('should correctly parse a 200 record', () => {
      const mockParts = [
        '200',           // Record identifier
        'NMI001',        // NMI
        'Description',   // NMI Configuration
        'E1',            // Register ID
        'E1',            // NMI Suffix
        'kWh',           // MDM Data Stream Identifier
        'kWh',           // Unit of Measure
        '1',             // Interval Length
        '30',            // Interval length in minutes
      ];
      
      const result = parse200Record(mockParts);
      
      expect(result).toEqual({
        nmi: 'NMI001',
        intervalLength: 30
      });
    });
  });
});