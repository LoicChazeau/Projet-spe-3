import React, { useEffect, useRef, useState } from 'react';
import './TryOnPage.css';
import glassesImage from '../assets/Lunettes_LUKKAS.png';
import { useNavigate, useLocation } from 'react-router-dom';

// Configuration de l'API
const API_BASE_URL = 'http://localhost:8002/api/v1/recommendation';

function TryOnPage() {
    const videoRef = useRef(null);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const analysisData = location.state;

    // États pour les données dynamiques
    const [frames, setFrames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFrame, setSelectedFrame] = useState(null);
  
    // Couleurs disponibles pour la monture
    const colors = [
      { name: 'Noir', value: 'black' },
      { name: 'Marron', value: 'brown' },
      { name: 'Bleu', value: 'blue' }
    ];
    const [selectedColor, setSelectedColor] = useState(colors[0].value);
  
    // Montures actuellement visibles dans le carousel (4 à la fois)
    const visibleFrames = frames.slice(carouselIndex, carouselIndex + 4);

    // Fonction pour récupérer les lunettes
    const fetchGlasses = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/glasses`);
        if (!response.ok) throw new Error('Erreur lors de la récupération des lunettes');
        const data = await response.json();
        setFrames(data);
        if (data.length > 0) {
          setSelectedFrame(data[0]);
        }
      } catch (err) {
        setError(err.message);
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };
  
    // Lorsqu'on change de tranche dans le carousel, si la monture sélectionnée n'est plus visible, on la met à jour
    useEffect(() => {
      if (frames.length > 0 && !visibleFrames.some(frame => frame.id === selectedFrame?.id)) {
        setSelectedFrame(frames[carouselIndex]);
      }
    }, [carouselIndex, frames, selectedFrame, visibleFrames]);
  
    // Navigation du carousel
    const handlePrev = () => {
      if (carouselIndex > 0) {
        setCarouselIndex(carouselIndex - 4);
      }
    };
  
    const handleNext = () => {
      if (carouselIndex + 4 < frames.length) {
        setCarouselIndex(carouselIndex + 4);
      }
    };
  
    useEffect(() => {
      // Charger les lunettes au montage du composant
      fetchGlasses();

      // Configuration de la webcam
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Erreur lors de l'accès à la webcam :", err);
        });

      // Cleanup function
      return () => {
        if (videoRef.current?.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
      };
    }, []);
  
    if (loading) {
      return <div className="loading">Chargement des lunettes...</div>;
    }

    if (error) {
      return <div className="error">Erreur: {error}</div>;
    }

    if (!selectedFrame) {
      return <div className="error">Aucune lunette disponible</div>;
    }
  
    return (
      <div className="face-shape-page">
        <button className="back-button" onClick={() => navigate('/home')}>
          <span className="material-icons">arrow_back</span>
        </button>
  
        {/* Contenu principal */}
        <div className="face-shape-container">
          <h1 className="page-title">Essayage de montures</h1>
          <p className="page-description">
            Essayez différentes montures en utilisant votre webcam.
          </p>
  
          {/* Flux vidéo de la webcam */}
          <div className="camera-container">
            <video ref={videoRef} autoPlay className="camera-feed" />
          </div>
  
          {/* Section d'affichage de la monture en essayage */}
          <div className="glasses-info">
            <div className="color-selector">
              {colors.map((color) => (
                <div
                  key={color.value}
                  className={`color-circle color-${color.value} ${selectedColor === color.value ? 'selected' : ''}`}
                  onClick={() => setSelectedColor(color.value)}
                />
              ))}
            </div>
            <p className="glasses-brand">{selectedFrame.brand}</p>
            <p className="glasses-model">{selectedFrame.model}</p>
            <p className="glasses-code">{selectedFrame.ref}</p>
            <p className="glasses-price">
              €{selectedFrame.price} - {colors.find(c => c.value === selectedColor)?.name}
            </p>
            <img
              src={selectedFrame.images?.[0] || glassesImage}
              alt={`${selectedFrame.brand} ${selectedFrame.model}`}
              className="glasses-thumbnail"
            />
          </div>
        </div>
  
        {/* Carousel avec flèches de navigation */}
        <div className="frame-carousel-container">
          <div className="frame-carousel">
            <button
              className="carousel-arrow left"
              onClick={handlePrev}
              disabled={carouselIndex === 0}
            >
              <span className="material-icons">chevron_left</span>
            </button>
            {visibleFrames.map((frame) => (
              <div
                key={frame.id}
                className={`frame-item ${selectedFrame.id === frame.id ? 'selected' : ''}`}
                onClick={() => setSelectedFrame(frame)}
              >
                <img
                  src={frame.images?.[0] || glassesImage}
                  alt={frame.model}
                  className="glasses-thumbnail"
                />
                <div className="frame-info">
                  <p className="frame-brand">{frame.brand}</p>
                  <p className="frame-model">{frame.model}</p>
                  <p className="frame-code">{frame.ref}</p>
                  <p className="frame-price">€{frame.price}</p>
                </div>
              </div>
            ))}
            <button
              className="carousel-arrow right"
              onClick={handleNext}
              disabled={carouselIndex + 4 >= frames.length}
            >
              <span className="material-icons">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Affichage des résultats bruts de l'analyse */}
        {analysisData && (
          <div className="analysis-results" style={{ padding: '20px', margin: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <h3>Résultats de l'analyse :</h3>
            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {JSON.stringify(analysisData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }
  
  export default TryOnPage;