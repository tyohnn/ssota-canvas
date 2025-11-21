/**
 * Image Visibility Toggle
 *
 * Process Model: Scenario 7 - 이미지 공개 설정 변경
 */

'use client';

import { Switch } from '@workspace/ui/components/ui/switch';
import { Label } from '@workspace/ui/components/ui/label';
import { Alert, AlertDescription } from '@workspace/ui/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useImageVisibility } from './use-image-visibility';
import type { ImageAsset } from '@/db/schemas/image-app-space-schema';

interface ImageVisibilityToggleProps {
  imageAsset: ImageAsset;
  onSuccess?: () => void;
}

export function ImageVisibilityToggle({
  imageAsset,
  onSuccess,
}: ImageVisibilityToggleProps) {
  const {
    isPublic,
    isChanging,
    canSetPublic,
    validationErrors,
    toggleVisibility,
  } = useImageVisibility(imageAsset, onSuccess);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="visibility">Public Visibility</Label>
          <p className="text-sm text-muted-foreground">
            {isPublic
              ? 'This image is visible in the community'
              : 'This image is private to your workspace'}
          </p>
        </div>
        <Switch
          id="visibility"
          checked={isPublic}
          onCheckedChange={toggleVisibility}
          disabled={isChanging || (!isPublic && !canSetPublic)}
        />
      </div>

      {!canSetPublic && !isPublic && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            To make this image public, you need to add a title and select a
            category.
          </AlertDescription>
        </Alert>
      )}

      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {validationErrors.map((error, i) => (
              <div key={i}>{error}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
