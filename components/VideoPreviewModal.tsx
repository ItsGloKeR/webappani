import React, { useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface VideoPreviewModalProps {
  videoUrl: string;
  imageUrl: string;
  onClose: () => void;
}

const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({ videoUrl, imageUrl, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, true);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-preview-title"
    >
      <div 
        ref={modalRef}
        className="bg-black rounded-lg shadow-xl w-full max-w-4xl aspect-video relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="video-preview-title" className="sr-only">Scene Preview</h2>
        <button 
          onClick={onClose} 
          className="absolute -top-4 -right-4 z-10 bg-gray-800 text-white rounded-full p-2 hover:bg-cyan-500 transition-colors"
          aria-label="Close preview"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <video
            src={`${videoUrl}?size=l`}
            poster={`${imageUrl}?size=l`}
            controls
            autoPlay
            loop
            muted
            className="w-full h-full rounded-lg"
        >
            Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

export default VideoPreviewModal;