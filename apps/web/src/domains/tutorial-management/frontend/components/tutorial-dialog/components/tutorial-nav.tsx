'use client';

import { useMemo } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { Check, Lock } from 'lucide-react';
import { Box } from '@workspace/ui/components/ui/box';
import { useTutorialDialogContext } from '../core/context';
import { useTutorialRegistry } from '../../../hooks/use-tutorial-registry';

/**
 * Tutorial Nav (Presentational)
 *
 * Left navigation showing tutorial groups and progress.
 * All tutorials are freely selectable (no prerequisite-based locking).
 */
export function TutorialNav() {
  const { selectedTutorialId, selectTutorial, progress } =
    useTutorialDialogContext();
  const { getTutorialGroups } = useTutorialRegistry();

  const groups = getTutorialGroups();

  // Set of completed tutorial IDs (for progress indicator only)
  const completedTutorialIds = useMemo(() => {
    return new Set(
      Object.entries(progress)
        .filter(([_, p]) => p.isCompleted)
        .map(([id]) => id)
    );
  }, [progress]);

  return (
    <nav className="p-4 space-y-6">
      <Box>
        <h2 className="text-lg font-semibold mb-2">Tutorials</h2>
        <p className="text-sm text-muted-foreground">
          Interactive guides to help you master SSOTA
        </p>
      </Box>

      {groups.map((group) => (
        <Box key={group.id} className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {group.name}
          </h3>
          <ul className="space-y-1">
            {group.tutorials.map((tutorial) => {
              const isCompleted = completedTutorialIds.has(tutorial.id);
              const isSelected = selectedTutorialId === tutorial.id;
              const isLocked = tutorial.status === 'locked';
              const isComingSoon = tutorial.status === 'coming-soon';

              return (
                <li key={tutorial.id}>
                  <button
                    type="button"
                    onClick={() => !isLocked && !isComingSoon && selectTutorial(tutorial.id)}
                    disabled={isLocked || isComingSoon}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                      'flex items-center gap-2',
                      isSelected && 'bg-accent',
                      !isSelected && !isLocked && !isComingSoon && 'hover:bg-accent',
                      (isLocked || isComingSoon) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {/* Status Icon */}
                    {isCompleted && (
                      <Check className="w-4 h-4 shrink-0 text-green-500" />
                    )}
                    {isLocked && (
                      <Lock className="w-4 h-4 shrink-0" />
                    )}
                    {!isCompleted && !isLocked && (
                      <Box className="w-4 h-4 shrink-0 rounded-full border-2 border-current" />
                    )}

                    {/* Tutorial Name */}
                    <span className="flex-1">{tutorial.name}</span>

                    {/* Coming Soon Badge */}
                    {isComingSoon && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        Soon
                      </span>
                    )}

                    {/* Estimated Time */}
                    {tutorial.estimatedMinutes && !isComingSoon && (
                      <span className="text-xs text-muted-foreground">
                        {tutorial.estimatedMinutes}m
                      </span>
                    )}
                  </button>
                </li>
              );
            }            )}
          </ul>
        </Box>
      ))}
    </nav>
  );
}
