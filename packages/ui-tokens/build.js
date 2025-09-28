const fs = require('fs');
const path = require('path');

const tokens = JSON.parse(fs.readFileSync('tokens.json', 'utf8'));

// Generate CSS custom properties
function generateCSS(tokens, theme = 'light') {
  const colors = tokens.color[theme];
  const spacing = tokens.spacing;
  const radius = tokens.radius;
  const shadow = tokens.shadow;
  const typography = tokens.typography;
  const zIndex = tokens.zIndex;
  const motion = tokens.motion;

  let css = `:root {\n`;
  
  // Colors
  Object.entries(colors).forEach(([key, value]) => {
    css += `  --color-${key}: ${value};\n`;
  });
  
  // Spacing
  Object.entries(spacing).forEach(([key, value]) => {
    css += `  --spacing-${key}: ${value};\n`;
  });
  
  // Radius
  Object.entries(radius).forEach(([key, value]) => {
    css += `  --radius-${key}: ${value};\n`;
  });
  
  // Shadow
  Object.entries(shadow).forEach(([key, value]) => {
    css += `  --shadow-${key}: ${value};\n`;
  });
  
  // Typography
  Object.entries(typography.fontFamily).forEach(([key, value]) => {
    css += `  --font-${key}: ${value};\n`;
  });
  Object.entries(typography.fontSize).forEach(([key, value]) => {
    css += `  --text-${key}: ${value};\n`;
  });
  Object.entries(typography.fontWeight).forEach(([key, value]) => {
    css += `  --weight-${key}: ${value};\n`;
  });
  
  // Z-index
  Object.entries(zIndex).forEach(([key, value]) => {
    css += `  --z-${key}: ${value};\n`;
  });
  
  // Motion
  Object.entries(motion.duration).forEach(([key, value]) => {
    css += `  --duration-${key}: ${value};\n`;
  });
  Object.entries(motion.easing).forEach(([key, value]) => {
    css += `  --easing-${key}: ${value};\n`;
  });
  
  css += `}\n\n`;
  
  // Dark theme
  if (theme === 'light') {
    css += `@media (prefers-color-scheme: dark) {\n  :root {\n`;
    Object.entries(tokens.color.dark).forEach(([key, value]) => {
      css += `    --color-${key}: ${value};\n`;
    });
    css += `  }\n}\n\n`;
    
    // High contrast theme
    css += `@media (prefers-contrast: high) {\n  :root {\n`;
    Object.entries(tokens.color.highContrast).forEach(([key, value]) => {
      css += `    --color-${key}: ${value};\n`;
    });
    css += `  }\n}\n\n`;
  }
  
  // Reduced motion
  css += `@media (prefers-reduced-motion: reduce) {\n  :root {\n`;
  css += `    --duration-fast: 0ms;\n`;
  css += `    --duration-normal: 0ms;\n`;
  css += `    --duration-slow: 0ms;\n`;
  css += `  }\n}\n`;
  
  return css;
}

// Generate TypeScript types
function generateTypes(tokens) {
  let types = `export interface AtlasTokens {\n`;
  
  function generateInterface(obj, indent = '  ') {
    let result = '';
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object' && !Array.isArray(value)) {
        result += `${indent}${key}: {\n`;
        result += generateInterface(value, indent + '  ');
        result += `${indent}};\n`;
      } else {
        result += `${indent}${key}: string;\n`;
      }
    });
    return result;
  }
  
  types += generateInterface(tokens);
  types += `}\n\n`;
  types += `export declare const tokens: AtlasTokens;\n`;
  
  return types;
}

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Generate files
const css = generateCSS(tokens);
const types = generateTypes(tokens);

fs.writeFileSync('dist/tokens.css', css);
fs.writeFileSync('dist/index.d.ts', types);
fs.writeFileSync('dist/index.js', `module.exports = ${JSON.stringify(tokens, null, 2)};`);

console.log('✅ Tokens built successfully');