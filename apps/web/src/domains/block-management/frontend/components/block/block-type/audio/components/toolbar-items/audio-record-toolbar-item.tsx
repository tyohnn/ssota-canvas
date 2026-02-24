'use client';

import { useCallback, useRef, useState } from 'react';

import { Mic, Square } from 'lucide-react';

import { LiveWaveform } from '@workspace/ui/components/eleven-labs/live-waveform';
import { MicSelector } from '@workspace/ui/components/eleven-labs/mic-selector';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';

import { useCanvasMetadata } from '@/domains/canvas-management/frontend/hooks';
import { useSupabaseStorage } from '@/domains/storage/hooks/use-supabase-storage';
import { StorageBucket } from '@/domains/storage/types/storage.types';

interface AudioRecordToolbarItemProps {
  blockId: string;
  disabled?: boolean;
  onValueChange?: (url: string) => Promise<void>;
}

/**
 * Audio Record Toolbar Item
 *
 * 오디오 녹음을 위한 툴바 아이템
 * - 녹음 다이얼로그 표시
 * - 마이크 선택 및 녹음
 * - Supabase Storage 업로드
 */
export function AudioRecordToolbarItem({
  blockId,
  disabled = false,
  onValueChange,
}: AudioRecordToolbarItemProps) {
  const { orgId, workspaceId } = useCanvasMetadata();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { upload, isUploading } = useSupabaseStorage();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : true,
      });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      // TODO: Show error toast
    }
  }, [selectedDeviceId]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleSave = useCallback(async () => {
    if (!recordedBlob || !onValueChange) return;

    try {
      // Convert Blob to File
      const file = new File([recordedBlob], `recording-${Date.now()}.webm`, {
        type: 'audio/webm',
      });

      // Upload to Supabase Storage
      const result = await upload({
        bucket: StorageBucket.CANVAS_ASSETS,
        file,
        blockId,
        orgId,
        workspaceId,
      });

      await onValueChange(result.url);
      setIsDialogOpen(false);
      setRecordedBlob(null);
    } catch (error) {
      console.error('Failed to upload recorded audio:', error);
      // TODO: Show error toast
    }
  }, [recordedBlob, onValueChange, upload, blockId, orgId, workspaceId]);

  const handleCancel = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
    setIsDialogOpen(false);
    setRecordedBlob(null);
  }, [isRecording, stopRecording]);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={e => {
              e.stopPropagation();
              setIsDialogOpen(true);
            }}
            disabled={disabled}
            aria-label="Record audio"
          >
            <Mic className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Record audio</p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Record audio</DialogTitle>
            <DialogDescription>
              Select a microphone and start recording
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Mic Selector */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Microphone</span>
              <MicSelector
                value={selectedDeviceId}
                onValueChange={setSelectedDeviceId}
              />
            </div>

            {/* Waveform */}
            <div className="border rounded-lg p-4 bg-muted/50">
              <LiveWaveform
                active={isRecording}
                deviceId={selectedDeviceId}
                mode="static"
                height={120}
                barWidth={3}
                barGap={1}
              />
            </div>

            {/* Recording Status */}
            {isRecording && (
              <div className="flex items-center justify-center gap-2 text-sm text-destructive">
                <span className="animate-pulse">●</span>
                Recording...
              </div>
            )}

            {recordedBlob && !isRecording && (
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                Recording complete ({(recordedBlob.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            {!isRecording ? (
              <>
                {recordedBlob && (
                  <Button onClick={handleSave} disabled={isUploading}>
                    {isUploading ? 'Saving...' : 'Save'}
                  </Button>
                )}
                {!recordedBlob && (
                  <Button onClick={startRecording}>Start recording</Button>
                )}
              </>
            ) : (
              <Button variant="destructive" onClick={stopRecording}>
                <Square className="h-4 w-4 mr-2" />
                Stop recording
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
