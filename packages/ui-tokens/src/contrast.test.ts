import { tokens } from './index';

// WCAG contrast calculation
function getLuminance(hex: string): number {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Token Contrast Tests', () => {
  test('Primary text on primary background meets AA (4.5:1)', () => {
    const ratio = getContrastRatio(tokens.color.text.primary, tokens.color.background.primary);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test('Primary text on primary background meets AAA (7:1)', () => {
    const ratio = getContrastRatio(tokens.color.text.primary, tokens.color.background.primary);
    expect(ratio).toBeGreaterThanOrEqual(7);
  });

  test('Secondary text on primary background meets AA (4.5:1)', () => {
    const ratio = getContrastRatio(tokens.color.text.secondary, tokens.color.background.primary);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test('Inverse text on inverse background meets AA (4.5:1)', () => {
    const ratio = getContrastRatio(tokens.color.text.inverse, tokens.color.background.inverse);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test('Interactive primary has sufficient contrast', () => {
    const ratio = getContrastRatio(tokens.color.interactive.primary, tokens.color.background.primary);
    expect(ratio).toBeGreaterThanOrEqual(3); // For non-text elements
  });
});