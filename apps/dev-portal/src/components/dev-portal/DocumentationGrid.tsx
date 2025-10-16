'use client';

export function DocumentationGrid() {
  const docSections = [
    {
      title: 'Getting Started',
      description: 'Quick setup guides and basic concepts',
      icon: '🚀',
      links: [
        { name: 'Installation', href: '/docs/installation' },
        { name: 'First Steps', href: '/docs/getting-started' },
        { name: 'Authentication', href: '/docs/auth' },
        { name: 'Configuration', href: '/docs/config' }
      ]
    },
    {
      title: 'Security',
      description: 'Security features and best practices',
      icon: '🔒',
      links: [
        { name: 'DPoP Implementation', href: '/docs/security/dpop' },
        { name: 'Receipt System', href: '/docs/security/receipts' },
        { name: 'Transport Security', href: '/docs/security/transport' },
        { name: 'Key Management', href: '/docs/security/keys' }
      ]
    },
    {
      title: 'APIs',
      description: 'Complete API documentation and references',
      icon: '🔌',
      links: [
        { name: 'REST APIs', href: '/docs/api/rest' },
        { name: 'GraphQL', href: '/docs/api/graphql' },
        { name: 'WebSocket', href: '/docs/api/websocket' },
        { name: 'Webhooks', href: '/docs/api/webhooks' }
      ]
    },
    {
      title: 'Chat & Messaging',
      description: 'Real-time communication features',
      icon: '💬',
      links: [
        { name: 'Chat Integration', href: '/docs/chat/integration' },
        { name: 'Message Delivery', href: '/docs/chat/delivery' },
        { name: 'End-to-End Encryption', href: '/docs/chat/e2ee' },
        { name: 'Media Sharing', href: '/docs/chat/media' }
      ]
    },
    {
      title: 'Performance',
      description: 'Optimization and monitoring guides',
      icon: '⚡',
      links: [
        { name: 'Performance Best Practices', href: '/docs/performance/best-practices' },
        { name: 'Caching Strategies', href: '/docs/performance/caching' },
        { name: 'Monitoring', href: '/docs/performance/monitoring' },
        { name: 'Load Testing', href: '/docs/performance/load-testing' }
      ]
    },
    {
      title: 'Deployment',
      description: 'Production deployment and scaling',
      icon: '🚀',
      links: [
        { name: 'Docker Setup', href: '/docs/deployment/docker' },
        { name: 'Kubernetes', href: '/docs/deployment/k8s' },
        { name: 'CI/CD Pipeline', href: '/docs/deployment/cicd' },
        { name: 'Environment Config', href: '/docs/deployment/env' }
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {docSections.map((section) => (
        <div 
          key={section.title}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">{section.icon}</span>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {section.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {section.description}
              </p>
              <ul className="mt-4 space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      {link.name} →
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}