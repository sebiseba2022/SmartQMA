import { describe, it, expect } from 'vitest';

export function isValidQrLaserSerial(serial: string): boolean {
  return /^\d{12}$/.test(serial.trim());
}

export function formatLaserSerial(date: Date, sequence: number): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const seqPadded = String(sequence).padStart(6, '0');
  return `${yy}${mm}${dd}${seqPadded}`;
}

export function parseLaserSerial(serial: string): {
  isValid: boolean;
  prefix?: string;
  sequence?: number;
  year?: number;
  month?: number;
  day?: number;
} {
  if (!isValidQrLaserSerial(serial)) {
    return { isValid: false };
  }
  const prefix = serial.slice(0, 6);
  const seqStr = serial.slice(6);
  const yy = parseInt(serial.slice(0, 2), 10);
  const mm = parseInt(serial.slice(2, 4), 10);
  const dd = parseInt(serial.slice(4, 6), 10);
  const sequence = parseInt(seqStr, 10);

  return {
    isValid: true,
    prefix,
    sequence,
    year: 2000 + yy,
    month: mm,
    day: dd,
  };
}

describe('QR Laser 12-digit Serial Logic', () => {
  it('validates strictly 12 digits numbers', () => {
    expect(isValidQrLaserSerial('260902000001')).toBe(true);
    expect(isValidQrLaserSerial('261029000005')).toBe(true);
    expect(isValidQrLaserSerial('123456789012')).toBe(true);

    // Nevalide: mai scurte sau mai lungi
    expect(isValidQrLaserSerial('26090200001')).toBe(false); // 11 cifre
    expect(isValidQrLaserSerial('2609020000001')).toBe(false); // 13 cifre
    expect(isValidQrLaserSerial('26090200000A')).toBe(false); // conține litere
    expect(isValidQrLaserSerial('')).toBe(false);
  });

  it('formats serial correctly using YYMMDD + 6 digits sequence', () => {
    // 2 Septembrie 2026 (#1) -> 260902000001 (exemplul specific cerut de utilizator)
    const sep2 = new Date(2026, 8, 2); // luna 8 este septembrie (0-indexed)
    expect(formatLaserSerial(sep2, 1)).toBe('260902000001');
    expect(formatLaserSerial(sep2, 42)).toBe('260902000042');

    // 29 Octombrie 2026 (#5) -> 261029000005
    const oct29 = new Date(2026, 9, 29);
    expect(formatLaserSerial(oct29, 5)).toBe('261029000005');
  });

  it('parses valid serial components accurately', () => {
    const parsed = parseLaserSerial('260902000015');
    expect(parsed.isValid).toBe(true);
    expect(parsed.prefix).toBe('260902');
    expect(parsed.sequence).toBe(15);
    expect(parsed.year).toBe(2026);
    expect(parsed.month).toBe(9);
    expect(parsed.day).toBe(2);
  });

  it('increments sequence cleanly from 1 to 1', () => {
    const today = new Date(2026, 9, 29);
    let seq = 1;
    const serial1 = formatLaserSerial(today, seq);
    expect(serial1).toBe('261029000001');

    seq += 1;
    const serial2 = formatLaserSerial(today, seq);
    expect(serial2).toBe('261029000002');
  });
});

