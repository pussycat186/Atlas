interface BackgroundsProps {
  luxury: boolean;
  theme: 'dark' | 'light';
}

export default function Backgrounds({ luxury, theme }: BackgroundsProps) {
  if (!luxury) return null;

  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10"></div>
      {theme === 'dark' && (
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)'
        }}></div>
      )}
    </div>
  );
}
