import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { VIDEO_SOURCES } from '../config.js';

const modalEase = { type: 'spring', stiffness: 260, damping: 25 };

export default function Video({ isOpen, onClose }) {
  const [step, setStep] = useState('countdown');
  const [count, setCount] = useState(5);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rotation, setRotation] = useState(0);
  const videoRef = useRef(null);
  const playerFrameRef = useRef(null);

  const unload = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
    setCurrentVideo(null);
    setVideoError(false);
    setIsPlaying(false);
    setRotation(0);
  };

  const reset = () => {
    unload();
    setStep('countdown');
    setCount(5);
  };

  useEffect(() => {
    if (!isOpen) {
      reset();
      return undefined;
    }
    setStep('countdown');
    setCount(5);
    setCurrentVideo(null);
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || step !== 'countdown') return undefined;
    const interval = window.setInterval(() => {
      setCount((value) => {
        if (value <= 1) {
          window.clearInterval(interval);
          setStep('options');
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isOpen, step]);

  const pickVideo = (video) => {
    setCurrentVideo(video);
    setVideoError(false);
    setRotation(0);
    setStep('player');
  };

  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  };

  const toggleFullscreen = async () => {
    const frame = playerFrameRef.current;
    if (!frame) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await frame.requestFullscreen();
    } catch {
      // Fullscreen can be unavailable in embedded previews or restricted browsers.
    }
  };

  const rotateVideo = () => {
    setRotation((value) => (value + 90) % 360);
  };

  const downloadVideo = async () => {
    if (!currentVideo) return;
    try {
      const response = await fetch(currentVideo.url);
      if (!response.ok) throw new Error('Video request failed');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = currentVideo.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      const anchor = document.createElement('a');
      anchor.href = currentVideo.url;
      anchor.download = currentVideo.filename;
      anchor.target = '_blank';
      anchor.rel = 'noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    }
  };

  const close = () => {
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="video-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
          <motion.div className="video-modal" initial={{ opacity: 0, scale: 0.84, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 16 }} transition={modalEase} role="dialog" aria-modal="true" aria-label="IGNITE video experience">
            <button className="modal-close" onClick={close} aria-label="Close video experience">×</button>
            {step === 'countdown' && <div className="video-countdown-step"><span className={`video-count-number ${count % 2 === 0 ? 'count-red' : ''}`}>{count}</span><h3>Get ready for the experience...</h3><p>Loading a little IGNITE magic.</p></div>}
            {step === 'options' && <div className="video-step"><span className="eyebrow">STEP 02 · CHOOSE YOUR EXPERIENCE</span><h3>Choose Your Experience</h3><div className="video-choice-stack"><button className="video-choice choice-blue" onClick={() => pickVideo(VIDEO_SOURCES.official)}>🎬 {VIDEO_SOURCES.official.label}</button><button className="video-choice choice-purple" onClick={() => setStep('posters')}>📺 Poster Release / Behind the Scenes</button></div></div>}
            {step === 'posters' && <div className="video-step"><button className="back-link" onClick={() => setStep('options')}>← Back</button><span className="eyebrow">STEP 03 · POSTER RELEASE</span><h3>Poster Release Videos</h3><div className="video-choice-stack"><button className="video-choice choice-pink" onClick={() => pickVideo(VIDEO_SOURCES.poster1)}>🎥 {VIDEO_SOURCES.poster1.label}</button><button className="video-choice choice-green" onClick={() => pickVideo(VIDEO_SOURCES.poster2)}>🎬 {VIDEO_SOURCES.poster2.label}</button></div></div>}
            {step === 'player' && currentVideo && <div className="video-step player-step"><span className="eyebrow">NOW PLAYING</span><h3>{currentVideo.label}</h3><div className={`video-frame ${currentVideo.url === '/ignite.mp4' ? 'video-frame-portrait' : ''}`} ref={playerFrameRef}>{videoError ? <div className="video-error-state"><span>📺</span><strong>Video could not be loaded.</strong><p>Please try again later or add the supplied media file to the public folder.</p></div> : <video ref={videoRef} key={currentVideo.url} controls autoPlay playsInline style={{ transform: `rotate(${rotation}deg)` }} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} onError={() => { setVideoError(true); window.alert('Video could not be loaded. Please try again.'); }}><source src={currentVideo.url} type="video/mp4" /></video>}</div><div className="player-controls" aria-label="Video controls"><button className="btn-primary btn-small" type="button" onClick={togglePlayback}>{isPlaying ? '⏸ Pause' : '▶ Play'}</button><button className="btn-primary btn-small" type="button" onClick={toggleFullscreen}>⛶ Fullscreen</button><button className="btn-primary btn-small" type="button" onClick={rotateVideo}>↻ Rotate</button></div><div className="player-actions"><button className="btn-primary btn-small" onClick={() => { unload(); setStep('options'); }}>← Back</button><button className="btn-primary btn-small btn-green" onClick={downloadVideo}>⬇️ Download</button></div><p className="video-help">Use the native video bar for seeking and volume. Rotate changes the viewing angle by 90°.</p></div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
