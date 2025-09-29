import { hashSync, verifySync, normalizeSync } from './index';

describe('Atlas Core', () => {
  test('hash produces consistent output', () => {
    const input = 'test string';
    const hash1 = hashSync(input);
    const hash2 = hashSync(input);
    expect(hash1).toBe(hash2);
    expect(hash1).toBeTruthy();
  });

  test('verify works with hash', () => {
    const input = 'test message';
    const hash = hashSync(input);
    expect(verifySync(input, hash)).toBe(true);
    expect(verifySync('different', hash)).toBe(false);
  });

  test('normalize trims and lowercases', () => {
    expect(normalizeSync('  TEST STRING  ')).toBe('test string');
    expect(normalizeSync('MiXeD cAsE')).toBe('mixed case');
  });
});