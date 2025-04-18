import React, { useEffect, useRef, useState } from 'react';
import './TryOnPage.css';
import glassesImage from '../assets/Lunettes_LUKKAS.png';
import { useNavigate, useLocation } from 'react-router-dom';

// Configuration de l'API
const API_BASE_URL = 'http://localhost:8002/api/v1/recommendation';

// Fonction pour convertir les noms de couleurs en français vers des codes hexadécimaux
const getColorHex = (colorName) => {
  const colorMap = {
    'Noir': '#000000',
    'Doré': '#FFD700',
    'Argenté': '#C0C0C0',
    'Écaille': '#8B4513',
    'Gris': '#808080',
    'Brun': '#8B4513',
    'Blanc': '#FFFFFF',
    'Bleu': '#0000FF',
    'Vert': '#008000',
    'Rouge': '#FF0000',
    'Jaune': '#FFD700',
    'Violet': '#800080',
    'Or': '#FFD700',
    'Argent': '#C0C0C0'
  };
  
  return colorMap[colorName] || '#CCCCCC'; // Couleur par défaut si non trouvée
};

function TryOnPage() {
    const videoRef = useRef(null);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const { faceAnalysis, recommendations, analyzedImage, isFromAnalysis } = location.state || {};

    // États pour les données dynamiques
    const [frames, setFrames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFrame, setSelectedFrame] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
  
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
          // Sélectionner la première couleur disponible par défaut
          if (data[0].colors && data[0].colors.length > 0) {
            setSelectedColor(data[0].colors[0]);
          }
        }
      } catch (err) {
        setError(err.message);
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    // Initialiser les données selon la source
    useEffect(() => {
      if (isFromAnalysis && recommendations) {
        // Si on vient de l'analyse, utiliser les recommandations
        setFrames(recommendations);
        if (recommendations.length > 0) {
          setSelectedFrame(recommendations[0]);
          // Sélectionner la première couleur disponible par défaut
          if (recommendations[0].colors && recommendations[0].colors.length > 0) {
            setSelectedColor(recommendations[0].colors[0]);
          }
        }
        setLoading(false);
      } else {
        // Sinon, charger le catalogue complet
        fetchGlasses();
      }
    }, [isFromAnalysis, recommendations]);

    // Mettre à jour la couleur sélectionnée quand on change de monture
    useEffect(() => {
      if (selectedFrame && selectedFrame.colors && selectedFrame.colors.length > 0) {
        // Si la couleur actuelle n'existe pas dans la nouvelle monture, prendre la première couleur disponible
        if (!selectedFrame.colors.includes(selectedColor)) {
          setSelectedColor(selectedFrame.colors[0]);
        }
      }
    }, [selectedFrame]);
  
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
          <h1 className="page-title">
            {isFromAnalysis ? 'Recommandations personnalisées' : 'Essayage de montures'}
          </h1>
          <p className="page-description">
            {isFromAnalysis 
              ? 'Voici les montures recommandées pour votre forme de visage.'
              : 'Essayez différentes montures en utilisant votre webcam.'}
          </p>
  
          {/* Affichage de l'image analysée et des résultats */}
          {isFromAnalysis && analyzedImage && faceAnalysis && (
            <div className="analysis-summary">
              <img src={analyzedImage} alt="Votre visage" className="analysis-thumbnail" />
              <div className="analysis-info">
                <h4>Analyse de votre visage</h4>
                <p>
                  {"Forme du visage : "}
                  <strong>
                    {faceAnalysis.face_shape 
                      ? faceAnalysis.face_shape.charAt(0).toUpperCase() + faceAnalysis.face_shape.slice(1)
                      : 'N/A'}
                  </strong>
                </p>
              </div>
              <button 
                className="new-analysis-button" 
                onClick={() => navigate('/face-shape')}
              >
                <span className="material-icons">refresh</span>
                Nouvelle analyse
              </button>
            </div>
          )}
  
          {/* Flux vidéo de la webcam */}
          <div className="camera-container">
            <video ref={videoRef} autoPlay className="camera-feed" />
          </div>
  
          {/* Section d'affichage de la monture en essayage */}
          <div className="glasses-info">
            {selectedFrame?.colors && (
                <div className="color-selector">
                    <p>Couleurs disponibles :</p>
                    <div className="color-circles">
                        {selectedFrame.colors.map((color, index) => {
                            const colorHex = getColorHex(color);
                            
                            return (
                                <div
                                    key={index}
                                    className={`color-circle ${selectedColor === color ? 'selected' : ''}`}
                                    onClick={() => setSelectedColor(color)}
                                    style={{ backgroundColor: colorHex }}
                                    title={color}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
            <p className="glasses-brand">{selectedFrame.brand}</p>
            <p className="glasses-model">{selectedFrame.model}</p>
            <p className="glasses-code">{selectedFrame.ref}</p>
            <p className="glasses-price">
              €{selectedFrame.price} - {selectedColor}
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
      </div>
    );
  }
  
  export default TryOnPage;