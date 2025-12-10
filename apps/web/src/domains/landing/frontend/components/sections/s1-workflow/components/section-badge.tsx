/**
 * Section Badge Component
 *
 * 섹션을 나타내는 배지 컴포넌트
 */

'use client';

export interface SectionBadgeProps {
  icon?: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
}

const variantStyles = {
  primary: 'border-primary bg-primary/10 text-primary',
  secondary: 'border-secondary bg-secondary/10 text-secondary',
  success:
    'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400',
  warning:
    'border-yellow-500 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
} as const;

export function SectionBadge({
  icon,
  label,
  variant = 'primary',
}: SectionBadgeProps) {
  return (
    <div>
      <div
        className={`inline-flex px-4 py-2 rounded-full border text-sm font-medium ${variantStyles[variant]}`}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {label}
      </div>
    </div>
  );
}
