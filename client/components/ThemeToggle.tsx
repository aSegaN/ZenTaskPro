import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Theme } from '../hooks/useTheme';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
  /** 'icon' = bouton rond compact (header) ; 'switch' = interrupteur avec libellés */
  variant?: 'icon' | 'switch';
  className?: string;
}

/**
 * Bouton de bascule de thème clair / sombre.
 */
const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle, variant = 'icon', className = '' }) => {
  const isDark = theme === 'dark';

  if (variant === 'switch') {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
        className={`relative inline-flex items-center h-9 w-[72px] rounded-full border border-line bg-surface2 p-1 transition-colors ${className}`}
      >
        <span
          className={`absolute top-1 h-7 w-7 rounded-full bg-surface shadow-md flex items-center justify-center transition-transform duration-300 ${isDark ? 'translate-x-[36px]' : 'translate-x-0'}`}
        >
          {isDark ? <Moon className="w-4 h-4 text-brand" /> : <Sun className="w-4 h-4 text-amber-500" />}
        </span>
        <Sun className={`w-4 h-4 ml-1.5 transition-opacity ${isDark ? 'opacity-30 text-inkmuted' : 'opacity-0'}`} />
        <Moon className={`w-4 h-4 ml-auto mr-1.5 transition-opacity ${isDark ? 'opacity-0' : 'opacity-30 text-inkmuted'}`} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
      className={`p-3 rounded-2xl text-inksoft hover:bg-surface2 hover:text-ink transition-all duration-200 ${className}`}
    >
      <div className="relative w-[22px] h-[22px]">
        <Sun className={`w-[22px] h-[22px] absolute inset-0 transition-all duration-300 ${isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
        <Moon className={`w-[22px] h-[22px] absolute inset-0 transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
      </div>
    </button>
  );
};

export default ThemeToggle;
