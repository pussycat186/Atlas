module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'This dependency is part of a circular relationship. You might want to revise your solution (i.e. use dependency inversion, make sure the modules have a single responsibility) ',
      from: {},
      to: {
        circular: true
      }
    },
    {
      name: 'no-orphans',
      comment: 'This is an orphan module - it\'s likely not used (anymore?). Either use it or remove it. If it\'s logical this module is an orphan (i.e. it\'s a config file), add an exception for it in your dependency-cruiser configuration. By default this rule does not apply to files that have a name ending in .config.js or .config.ts.',
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)([^/]*\\.config\\.(js|ts|json)$|vite\\.config\\.(js|ts)$|vitest\\.config\\.(js|ts)$|jest\\.config\\.(js|ts)$|tailwind\\.config\\.(js|ts)$|postcss\\.config\\.(js|ts)$|eslint\\.config\\.(js|ts)$|prettier\\.config\\.(js|ts)$)'
        ]
      },
      to: {}
    },
    {
      name: 'no-deprecated-core',
      comment: 'A module depends on a node core module that has been deprecated. Find an alternative - these are bound to exist - node doesn\'t deprecate lightly.',
      severity: 'warn',
      from: {},
      to: {
        dependencyTypes: ['core'],
        path: [
          '^(punycode|domain|constants|sys|_linklist|_stream_wrap)$'
        ]
      }
    },
    {
      name: 'not-to-deprecated',
      comment: 'This module uses a (version of an) npm module that has been deprecated. Either upgrade to a later version of that module, or find an alternative. Deprecated modules are a security risk.',
      severity: 'warn',
      from: {},
      to: {
        dependencyTypes: ['deprecated']
      }
    },
    {
      name: 'no-non-package-json',
      comment: 'This module depends on an npm package that isn\'t in the \'dependencies\' section of your package.json. That\'s problematic as the package either (1) won\'t be available on live (2) will be tested by another package (hence creating a false sense of security) or (3) will be available to all modules (causing potential name clashes).',
      severity: 'error',
      from: {},
      to: {
        dependencyTypes: ['npm-no-pkg', 'npm-unknown']
      }
    },
    {
      name: 'not-to-unresolvable',
      comment: 'This module depends on a module that cannot be found (\'resolved to a very ugly path\'). We\'ll call that \'unresolvable\'.',
      severity: 'error',
      from: {},
      to: {
        couldNotResolve: true
      }
    },
    {
      name: 'no-duplicate-dep-types',
      comment: 'Likely this module depends on an external (\'npm\') package that occurs more than once in your package.json i.e. both as a devDependencies and in dependencies. This will cause maintenance problems later on.',
      severity: 'warn',
      from: {},
      to: {
        moreThanOneDependencyType: true,
        // as it's pretty common to have a type import from a dependency that's also a devDependency
        // ignore the cases where the dependency is used only as a type
        pathNot: ['\\.d\\.ts$']
      }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    includeOnly: '^(packages|services|apps)',
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default']
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
        theme: {
          graph: {
            splines: 'ortho'
          },
          modules: [
            {
              criteria: { source: '^packages/' },
              attributes: { fillcolor: 'lime' }
            },
            {
              criteria: { source: '^services/' },
              attributes: { fillcolor: 'lightblue' }
            },
            {
              criteria: { source: '^apps/' },
              attributes: { fillcolor: 'orange' }
            }
          ],
          dependencies: [
            {
              criteria: { 'rules[0]': 'no-circular' },
              attributes: { color: 'red' }
            }
          ]
        }
      }
    }
  }
};
