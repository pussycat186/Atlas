'use client';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  status: 'active' | 'inactive' | 'warning';
}

interface ConstellationViewProps {
  nodes: Node[];
  'data-testid'?: string;
}

export function ConstellationView({ nodes, 'data-testid': testId }: ConstellationViewProps) {
  const getNodeColor = (status: Node['status']) => {
    switch (status) {
      case 'active': return 'fill-green-500';
      case 'warning': return 'fill-yellow-500';
      case 'inactive': return 'fill-gray-400';
    }
  };

  return (
    <div className="w-full h-96 bg-gray-900 rounded-lg relative overflow-hidden" data-testid={testId}>
      <svg className="w-full h-full" viewBox="0 0 400 300">
        {/* Connections */}
        {nodes.map((node, i) => 
          nodes.slice(i + 1).map((otherNode, j) => (
            <line
              key={`${node.id}-${otherNode.id}`}
              x1={node.x}
              y1={node.y}
              x2={otherNode.x}
              y2={otherNode.y}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
            />
          ))
        )}
        
        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r="8"
              className={getNodeColor(node.status)}
            />
            <text
              x={node.x}
              y={node.y - 15}
              textAnchor="middle"
              className="fill-white text-xs"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}