import React, { useRef, useEffect, useState } from 'react';
import './VideoTest.css';
import GlassesOverlay from '../components/GlassesOverlay';

const VideoTest = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 });
  const [glassesPosition, setGlassesPosition] = useState(null);

  useEffect(() => {
    // Initialiser la connexion WebSocket
    wsRef.current = new WebSocket('ws://localhost:8001/api/v1/face/ws');

    wsRef.current.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
      setError(null);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setError('Erreur de connexion au serveur');
    };

    // Démarrer la webcam
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 640 },
        height: { ideal: 480 }
      } 
    })
    .then(stream => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Mettre à jour les dimensions quand la vidéo est chargée
        videoRef.current.onloadedmetadata = () => {
          setDimensions({
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight
          });
        };
      }
    })
    .catch(err => {
      console.error('Erreur webcam:', err);
      setError('Impossible d\'accéder à la webcam');
    });

    // Nettoyage
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const drawLandmarks = (landmarks, ctx) => {
    if (!landmarks || !ctx) return;

    ctx.fillStyle = '#00FF00';
    landmarks.landmarks.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const processVideo = () => {
    if (!videoRef.current || !canvasRef.current || !wsRef.current || !isConnected) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // S'assurer que le canvas a la même taille que la vidéo
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Dessiner la vidéo sur le canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Envoyer l'image au serveur
    try {
      const imageData = canvas.toDataURL('image/jpeg', 0.7);
      wsRef.current.send(imageData);
    } catch (err) {
      console.error('Erreur envoi image:', err);
    }
  };

  // Gérer les messages du serveur
  useEffect(() => {
    if (!wsRef.current) return;

    wsRef.current.onmessage = (event) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const data = JSON.parse(event.data);

      if (data.success) {
        // Redessiner l'image de la vidéo
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        if (data.landmarks) {
          // Dessiner les landmarks
          drawLandmarks(data.landmarks, ctx);
        }
        
        if (data.glasses_position) {
          // Mettre à jour la position des lunettes
          setGlassesPosition(data.glasses_position);
        }
      }
    };
  }, []);

  // Boucle d'animation
  useEffect(() => {
    const interval = setInterval(processVideo, 1000 / 30); // 30 FPS
    return () => clearInterval(interval);
  }, [isConnected]);

  return (
    <div className="video-test-container">
      <h1>Test Détection Faciale</h1>
      {error && <div className="error-message">{error}</div>}
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          width={dimensions.width}
          height={dimensions.height}
        />
        <canvas
          ref={canvasRef}
          className="video-canvas"
          width={dimensions.width}
          height={dimensions.height}
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />
        {glassesPosition && (
          <GlassesOverlay
            glassesPosition={glassesPosition}
            canvasWidth={dimensions.width}
            canvasHeight={dimensions.height}
          />
        )}
      </div>
      <div className="status-indicator">
        Status: {isConnected ? 'Connecté' : 'Déconnecté'}
      </div>
    </div>
  );
};

export default VideoTest; 