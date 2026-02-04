/**
 * Mock YouTube Block Types
 */

export interface MockYoutubeBlockUIState {
  url: string;
  showPlayer: boolean;
  setUrl: (url: string) => void;
  setShowPlayer: (show: boolean) => void;
}

export interface MockYoutubeBlockProps {
  url: string;
  showPlayer: boolean;
  onUrlChange: (url: string) => void;
  onUrlSubmit: () => void;
}
