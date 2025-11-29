/**
 * Block Management Components Index
 *
 * 블록 관리 컴포넌트들의 중앙 export
 */

// Base Block Components
export * from './base-block';

// Text Block Components
export * from './text';

// Shape Block Components
export * from './shape';

// Markdown Block Components
export * from './markdown';

// Python Block Components
export * from './python';

// YouTube Block Components
export * from './youtube';

// Image Block Components
export * from './image';

// Link Block Components
export * from './link';

// Audio Block Components
export * from './audio';

// PDF Block Components
// NOTE: PDF block is exported separately to avoid SSR issues with pdfjs-dist
// Use dynamic import: import dynamic from 'next/dynamic';
// const PdfBlock = dynamic(() => import('./pdf').then(m => ({ default: m.PdfBlock })), { ssr: false });

// GitHub Block Components
export * from './github-branch';
export * from './github-commit';

// React Preview Block Components
export * from './react-preview';

// Vercel Deployment Block Components
export * from './vercel-deployment';
