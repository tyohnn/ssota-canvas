import { describe, it, expect } from 'vitest';
import { MediaURL } from '../media-url.vo';
import { BlockManagementError } from '../../errors/block-management.error';

describe('MediaURL Value Object', () => {
  describe('생성자', () => {
    it('유효한 URL로 생성되어야 한다', () => {
      const url = new MediaURL('https://example.com/image.jpg');
      expect(url.value).toBe('https://example.com/image.jpg');
      expect(url.fileType).toBe('file');
      expect(url.maxSize).toBe(50 * 1024 * 1024); // 50MB
    });
    
    it('이미지 타입으로 생성되어야 한다', () => {
      const url = new MediaURL('https://example.com/image.jpg', 'image');
      expect(url.value).toBe('https://example.com/image.jpg');
      expect(url.fileType).toBe('image');
      expect(url.maxSize).toBe(10 * 1024 * 1024); // 10MB
    });
    
    it('잘못된 URL 형식에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new MediaURL('invalid-url')).toThrow(BlockManagementError);
      expect(() => new MediaURL('invalid-url')).toThrow('Invalid media URL format');
    });
    
    it('빈 문자열은 허용하지 않아야 한다', () => {
      expect(() => new MediaURL('')).toThrow(BlockManagementError);
    });
    
    it('null이나 undefined는 허용하지 않아야 한다', () => {
      expect(() => new MediaURL(null as any)).toThrow(BlockManagementError);
      expect(() => new MediaURL(undefined as any)).toThrow(BlockManagementError);
    });
    
    it('HTTP URL도 허용해야 한다', () => {
      const url = new MediaURL('http://example.com/file.pdf');
      expect(url.value).toBe('http://example.com/file.pdf');
    });
    
    it('HTTPS가 아닌 프로토콜은 거부해야 한다', () => {
      expect(() => new MediaURL('ftp://example.com/file.pdf')).toThrow(BlockManagementError);
      expect(() => new MediaURL('file:///path/to/file.pdf')).toThrow(BlockManagementError);
    });
  });
  
  describe('validateFileType', () => {
    it('올바른 파일 타입을 검증해야 한다', () => {
      const imageUrl = new MediaURL('https://example.com/image.jpg', 'image');
      expect(() => imageUrl.validateFileType('image')).not.toThrow();
    });
    
    it('잘못된 파일 타입에 대해 예외를 발생시켜야 한다', () => {
      const imageUrl = new MediaURL('https://example.com/image.jpg', 'image');
      expect(() => imageUrl.validateFileType('file')).toThrow(BlockManagementError);
      expect(() => imageUrl.validateFileType('file')).toThrow('Expected file but got image');
    });
  });
  
  describe('validateFileSize', () => {
    it('허용된 파일 크기를 검증해야 한다', () => {
      const imageUrl = new MediaURL('https://example.com/image.jpg', 'image');
      expect(() => imageUrl.validateFileSize(5 * 1024 * 1024)).not.toThrow(); // 5MB
    });
    
    it('파일 크기 제한을 초과하면 예외를 발생시켜야 한다', () => {
      const imageUrl = new MediaURL('https://example.com/image.jpg', 'image');
      expect(() => imageUrl.validateFileSize(15 * 1024 * 1024)).toThrow(BlockManagementError); // 15MB
      expect(() => imageUrl.validateFileSize(15 * 1024 * 1024)).toThrow('File size 15728640 bytes exceeds maximum allowed size 10485760 bytes');
    });
    
    it('파일 타입별로 다른 크기 제한을 적용해야 한다', () => {
      const fileUrl = new MediaURL('https://example.com/document.pdf', 'file');
      expect(() => fileUrl.validateFileSize(30 * 1024 * 1024)).not.toThrow(); // 30MB
      expect(() => fileUrl.validateFileSize(60 * 1024 * 1024)).toThrow(BlockManagementError); // 60MB
    });
  });
  
  describe('validateMimeType', () => {
    it('이미지 파일의 허용된 MIME 타입을 검증해야 한다', () => {
      const imageUrl = new MediaURL('https://example.com/image.jpg', 'image');
      expect(() => imageUrl.validateMimeType('image/jpeg')).not.toThrow();
      expect(() => imageUrl.validateMimeType('image/png')).not.toThrow();
      expect(() => imageUrl.validateMimeType('image/gif')).not.toThrow();
      expect(() => imageUrl.validateMimeType('image/webp')).not.toThrow();
      expect(() => imageUrl.validateMimeType('image/svg+xml')).not.toThrow();
    });
    
    it('파일의 허용된 MIME 타입을 검증해야 한다', () => {
      const fileUrl = new MediaURL('https://example.com/document.pdf', 'file');
      expect(() => fileUrl.validateMimeType('application/pdf')).not.toThrow();
      expect(() => fileUrl.validateMimeType('text/plain')).not.toThrow();
      expect(() => fileUrl.validateMimeType('application/json')).not.toThrow();
      expect(() => fileUrl.validateMimeType('application/zip')).not.toThrow();
    });
    
    it('허용되지 않는 MIME 타입에 대해 예외를 발생시켜야 한다', () => {
      const imageUrl = new MediaURL('https://example.com/image.jpg', 'image');
      expect(() => imageUrl.validateMimeType('application/pdf')).toThrow(BlockManagementError);
      expect(() => imageUrl.validateMimeType('application/pdf')).toThrow('MIME type application/pdf is not supported for image files');
    });
  });
  
  describe('getFileExtension', () => {
    it('파일 확장자를 추출해야 한다', () => {
      const url = new MediaURL('https://example.com/image.jpg');
      expect(url.getFileExtension()).toBe('jpg');
    });
    
    it('대소문자를 구분하지 않고 소문자로 반환해야 한다', () => {
      const url = new MediaURL('https://example.com/image.JPG');
      expect(url.getFileExtension()).toBe('jpg');
    });
    
    it('확장자가 없으면 빈 문자열을 반환해야 한다', () => {
      const url = new MediaURL('https://example.com/file');
      expect(url.getFileExtension()).toBe('');
    });
  });
  
  describe('getFileName', () => {
    it('파일명을 추출해야 한다', () => {
      const url = new MediaURL('https://example.com/path/to/image.jpg');
      expect(url.getFileName()).toBe('image.jpg');
    });
    
    it('경로가 없으면 빈 문자열을 반환해야 한다', () => {
      const url = new MediaURL('https://example.com/');
      expect(url.getFileName()).toBe('');
    });
  });
  
  describe('equals', () => {
    it('동일한 URL과 타입을 가진 MediaURL은 같다고 판정되어야 한다', () => {
      const url1 = new MediaURL('https://example.com/image.jpg', 'image');
      const url2 = new MediaURL('https://example.com/image.jpg', 'image');
      expect(url1.equals(url2)).toBe(true);
    });
    
    it('다른 URL을 가진 MediaURL은 다르다고 판정되어야 한다', () => {
      const url1 = new MediaURL('https://example.com/image1.jpg', 'image');
      const url2 = new MediaURL('https://example.com/image2.jpg', 'image');
      expect(url1.equals(url2)).toBe(false);
    });
    
    it('다른 타입을 가진 MediaURL은 다르다고 판정되어야 한다', () => {
      const url1 = new MediaURL('https://example.com/file.pdf', 'file');
      const url2 = new MediaURL('https://example.com/file.pdf', 'image');
      expect(url1.equals(url2)).toBe(false);
    });
    
    it('null과 비교하면 false를 반환해야 한다', () => {
      const url = new MediaURL('https://example.com/image.jpg');
      expect(url.equals(null as any)).toBe(false);
    });
  });
  
  describe('toString', () => {
    it('URL 값을 문자열로 반환해야 한다', () => {
      const url = new MediaURL('https://example.com/image.jpg');
      expect(url.toString()).toBe('https://example.com/image.jpg');
    });
  });
});
