/**
 * Style Dictionary Configuration
 * Transforms design tokens into CSS variables, TypeScript exports, and Tailwind theme
 */

const StyleDictionary = require('style-dictionary');

// Custom transform to handle token references
StyleDictionary.registerTransform({
  name: 'atlas/reference',
  type: 'value',
  matcher: (token) => typeof token.value === 'string' && token.value.includes('{'),
  transformer: (token) => {
    // Simple reference resolution - handles {color.blue.6} format
    let value = token.value;
    const refMatch = value.match(/\{([^}]+)\}/);
    if (refMatch) {
      const path = refMatch[1].split('.');
      // Return CSS variable reference
      return `var(--${path.join('-')})`;
    }
    return value;
  }
});

// Custom format for CSS variables with theme support
StyleDictionary.registerFormat({
  name: 'css/variables-themed',
  formatter: function({ dictionary }) {
    const lightTokens = [];
    const darkTokens = [];
    const baseTokens = [];
    
    dictionary.allTokens.forEach(token => {
      const cssVar = `--${token.path.join('-')}`;
      const value = token.value;
      
      // Check if token has dark mode variant
      if (token.$extensions?.mode) {
        lightTokens.push(`  ${cssVar}: ${token.$extensions.mode.light};`);
        darkTokens.push(`  ${cssVar}: ${token.$extensions.mode.dark};`);
      } else {
        baseTokens.push(`  ${cssVar}: ${value};`);
      }
    });
    
    return [
      '/**',
      ' * Atlas Design Tokens - Auto-generated CSS Variables',
      ' * DO NOT EDIT MANUALLY - Generated from design/tokens/',
      ' */',
      '',
      ':root {',
      ...baseTokens,
      ...lightTokens,
      '}',
      '',
      '[data-theme="dark"] {',
      ...darkTokens,
      '}',
      ''
    ].join('\n');
  }
});

// Custom format for TypeScript exports
StyleDictionary.registerFormat({
  name: 'typescript/module',
  formatter: function({ dictionary }) {
    const tokens = {};
    
    dictionary.allTokens.forEach(token => {
      const path = token.path;
      let current = tokens;
      
      path.forEach((part, index) => {
        if (index === path.length - 1) {
          current[part] = token.value;
        } else {
          current[part] = current[part] || {};
          current = current[part];
        }
      });
    });
    
    return [
      '/**',
      ' * Atlas Design Tokens - TypeScript Module',
      ' * DO NOT EDIT MANUALLY - Generated from design/tokens/',
      ' */',
      '',
      'export const tokens = ' + JSON.stringify(tokens, null, 2) + ' as const;',
      '',
      'export type Tokens = typeof tokens;',
      ''
    ].join('\n');
  }
});

// Custom format for Tailwind theme
StyleDictionary.registerFormat({
  name: 'tailwind/theme',
  formatter: function({ dictionary }) {
    const theme = {
      colors: {},
      spacing: {},
      fontSize: {},
      fontWeight: {},
      borderRadius: {},
      boxShadow: {},
      zIndex: {}
    };
    
    dictionary.allTokens.forEach(token => {
      const [category, ...rest] = token.path;
      
      if (category === 'color') {
        let current = theme.colors;
        rest.forEach((part, index) => {
          if (index === rest.length - 1) {
            current[part] = token.value;
          } else {
            current[part] = current[part] || {};
            current = current[part];
          }
        });
      } else if (category === 'spacing') {
        const key = rest.join('-');
        theme.spacing[key] = token.value;
      } else if (category === 'font' && rest[0] === 'size') {
        theme.fontSize[rest[1]] = token.value;
      } else if (category === 'font' && rest[0] === 'weight') {
        theme.fontWeight[rest[1]] = token.value;
      } else if (category === 'radius') {
        theme.borderRadius[rest[0]] = token.value;
      } else if (category === 'shadow') {
        theme.boxShadow[rest[0]] = token.value;
      } else if (category === 'zIndex') {
        theme.zIndex[rest[0]] = token.value;
      }
    });
    
    return [
      '/**',
      ' * Atlas Tailwind Theme - Auto-generated',
      ' * DO NOT EDIT MANUALLY - Generated from design/tokens/',
      ' */',
      '',
      'module.exports = ' + JSON.stringify(theme, null, 2) + ';',
      ''
    ].join('\n');
  }
});

module.exports = {
  source: ['design/tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'packages/@atlas/design-system/dist/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables-themed'
        }
      ]
    },
    ts: {
      transformGroup: 'js',
      buildPath: 'packages/@atlas/design-system/src/',
      files: [
        {
          destination: 'tokens.ts',
          format: 'typescript/module'
        }
      ]
    },
    tailwind: {
      transformGroup: 'js',
      buildPath: './',
      files: [
        {
          destination: 'tailwind.tokens.cjs',
          format: 'tailwind/theme'
        }
      ]
    }
  }
};
