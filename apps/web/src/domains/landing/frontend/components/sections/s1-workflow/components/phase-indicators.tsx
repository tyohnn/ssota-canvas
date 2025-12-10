/**
 * Phase Indicators Component
 *
 * 현재 Phase를 표시하는 진행 바
 */

'use client';

export interface PhaseIndicatorsProps {
  totalPhases: number;
  currentPhase: number;
}

export function PhaseIndicators({
  totalPhases,
  currentPhase,
}: PhaseIndicatorsProps) {
  return (
    <div className="flex gap-2 pt-4">
      {Array.from({ length: totalPhases }).map((_, index) => (
        <div
          key={index}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            index === currentPhase
              ? 'bg-primary'
              : index < currentPhase
                ? 'bg-primary/30'
                : 'bg-border'
          }`}
        />
      ))}
    </div>
  );
}
