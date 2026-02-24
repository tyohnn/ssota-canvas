'use client';

import { Check, Mic, Square } from 'lucide-react';

import { LiveWaveform } from '@workspace/ui/components/eleven-labs/live-waveform';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/ui/dialog';

import { Box } from '@/components/ui/box';

export interface AudioRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isRecording: boolean;
  recordedBlob: Blob | null;
  isUploading: boolean;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => void;
  onSaveRecording: () => Promise<void>;
  onRecordAgain: () => void;
  onClose: () => void;
}

export function AudioRecordDialog({
  open,
  onOpenChange,
  isRecording,
  recordedBlob,
  isUploading,
  onStartRecording,
  onStopRecording,
  onSaveRecording,
  onRecordAgain,
  onClose,
}: AudioRecordDialogProps) {
  const handleOpenChange = (next: boolean) => {
    if (!next) onClose();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Audio recording</DialogTitle>
          <DialogDescription>
            Record audio with your microphone
          </DialogDescription>
        </DialogHeader>

        <Box className="space-y-4">
          <Box className="bg-muted/30 rounded-lg p-4">
            <LiveWaveform
              active={isRecording}
              processing={false}
              height={80}
              barWidth={3}
              barGap={2}
              mode="static"
              fadeEdges={true}
              barColor="gray"
              historySize={120}
            />
          </Box>

          <Box className="text-center">
            {isRecording ? (
              <p className="text-sm text-muted-foreground">
                🔴 Recording... (Click Stop to finish)
              </p>
            ) : recordedBlob ? (
              <p className="text-sm text-muted-foreground">
                ✅ Recording complete! Click Save to store
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click Start to begin recording
              </p>
            )}
          </Box>
        </Box>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!recordedBlob ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isRecording}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={isRecording ? onStopRecording : onStartRecording}
                className="gap-2"
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    Start
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onRecordAgain()}
              >
                Record again
              </Button>
              <Button
                type="button"
                onClick={onSaveRecording}
                disabled={isUploading}
                className="gap-2"
              >
                {isUploading ? (
                  'Uploading...'
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
