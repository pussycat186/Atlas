'use client';

interface SLOGaugeProps {
  value: number; // 0-100
  target: number; // 0-100
  label: string;
  'data-testid'?: string;
}

export function SLOGauge({ value, target, label, 'data-testid': testId }: SLOGaugeProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  const getColor = () => {
    if (value >= target) return 'text-green-600';
    if (value >= target * 0.9) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex flex-col items-center" data-testid={testId}>
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={getColor()}
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-semibold ${getColor()}`}>
            {value.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">Target: {target}%</div>
      </div>
    </div>
  );
}