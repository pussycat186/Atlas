interface BadgeProps {
  children: React.ReactNode;
  variant: 'basic' | 'pro';
}

export function Badge({ children, variant }: BadgeProps) {
  return (
    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
      variant === 'pro' 
        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
        : 'bg-blue-500 text-white'
    }`}>
      {children}
    </div>
  );
}

interface ChipProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export function Chip({ children, active, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded-full text-xs transition-colors ${
        active 
          ? 'bg-purple-500 text-white' 
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {children}
    </button>
  );
}
