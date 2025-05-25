const fs = require('fs');
const path = require('path');
const {
  getTimestamp,
  parse300Record,
  createSqlInsert,
  validateHeaderRecord,
  validateFooterRecord,
  parse200Record
} = require('../src/utils');

describe('NEM12 Parser Integration', () => {
  describe('End-to-end record processing', () => {
    test('should process NEM12 records in sequence', () => {
      // This test simulates processing a sequence of records
      const mockRecords = [
        '100,NEM12,202301010000,MYCOMP,MYDATA', // header
        '200,NMI001,Description,E1,E1,kWh,kWh,1,30', // NMI data
        '300,20230101,10.5,11.2,12.0,14.5,16.7,15.4,14.3,13.2,11.0,10.5,9.8,8.7,7.6,8.9,9.2,10.3,11.4,12.5,13.6,14.7,15.8,16.9,17.0,18.1,19.2,20.3,21.4,22.5,23.6,24.7,25.8,26.9,27.0,28.1,29.2,30.3,31.4,32.5,33.6,34.7,35.8,36.9,37.0,38.1,39.2,40.3,41.4,42.5,A,', // interval data
        '900' // footer
      ];
      
      // Process header
      const headerParts = mockRecords[0].split(',');
      expect(validateHeaderRecord(headerParts)).toBe(true);

      // Process NMI data
      const nmiParts = mockRecords[1].split(',');
      const nmiData = parse200Record(nmiParts);
      expect(nmiData.nmi).toBe('NMI001');
      expect(nmiData.intervalLength).toBe(30);

      // Process 300 record
      const intervalParts = mockRecords[2].split(',');
      const intervalData = parse300Record(intervalParts);
      
      // Create intervals for SQL
      const intervals = [];
      intervalData.values.forEach((val, i) => {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          intervals.push({
            nmi: nmiData.nmi,
            timestamp: getTimestamp(intervalData.date, i, nmiData.intervalLength),
            value: num
          });
        }
      });

      // Verify first and last intervals
      expect(intervals[0]).toEqual({
        nmi: 'NMI001',
        timestamp: '2023-01-01 00:00:00',
        value: 10.5
      });
      
      expect(intervals[intervals.length - 1]).toEqual({
        nmi: 'NMI001',
        timestamp: '2023-01-01 23:30:00',
        value: 42.5
      });

      // Generate SQL
      const sql = createSqlInsert(intervals, 10);
      expect(sql).toContain("INSERT INTO meter_readings");
      expect(sql).toContain("('NMI001', '2023-01-01 00:00:00', 10.5)");
      expect(sql).toContain("('NMI001', '2023-01-01 23:30:00', 42.5)");

      // Process footer
      const footerParts = mockRecords[3].split(',');
      expect(validateFooterRecord(footerParts)).toBe(true);
    });
  });

  describe('Error cases', () => {
    test('should handle missing values in 300 record', () => {
      // Some empty values in the 300 record
      const parts = [
        '300',
        '20230101',
        '10.5', '', '12.0', // empty second value
        ...Array(45).fill('1'),
        'A',
        ''
      ];
      
      const record = parse300Record(parts);
      
      // Check that values array has the expected pattern
      expect(record.values[0]).toBe('10.5');
      expect(record.values[1]).toBe('');
      expect(record.values[2]).toBe('12.0');
      
      // Create intervals filtering out invalid values
      const intervals = [];
      record.values.forEach((val, i) => {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          intervals.push({
            nmi: 'TEST',
            timestamp: getTimestamp(record.date, i, 30),
            value: num
          });
        }
      });
      
      // Should skip the empty value
      expect(intervals.length).toBe(record.values.filter(v => v !== '').length);
      
      // SQL generation should work for valid entries
      const sql = createSqlInsert(intervals);
      expect(sql).not.toBe('');
    });
    
    test('should handle invalid date formats', () => {
      // This test will cause the getTimestamp function to fail with an invalid date
      expect(() => {
        getTimestamp('invalid', 0, 30);
      }).not.toThrow(); // The function doesn't throw but returns an invalid date
      
      const result = getTimestamp('invalid', 0, 30);
      expect(result).toContain('NaN');
    });
  });
});