import React, { useEffect, useRef, useState } from 'react';
import './TryOnPage.css';
import glassesImage from '../assets/Lunettes_LUKKAS.png';
import { useNavigate } from 'react-router-dom';

function TryOnPage() {
    const videoRef = useRef(null);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const navigate = useNavigate();
  
    // Tableau de montures avec leurs informations
    const frames = [
      {
        id: 1,
        name: 'Wayfarer',
        brand: 'Ray-Ban',
        model: 'Wayfarer',
        code: 'LU 2305 NODO 51/21',
        price: 172,
        glasses: glassesImage,
      },
      {
        id: 2,
        name: 'Clubmaster',
        brand: 'Ray-Ban',
        model: 'Clubmaster',
        code: 'RB 1234',
        price: 189,
        glasses: glassesImage,
      },
      {
        id: 3,
        name: 'Aviator',
        brand: 'Ray-Ban',
        model: 'Aviator',
        code: 'RB 5678',
        price: 200,
        glasses: glassesImage,
      },
      {
        id: 4,
        name: 'Round',
        brand: 'Ray-Ban',
        model: 'Round',
        code: 'RB 9101',
        price: 150,
        glasses: glassesImage,
      },
      {
        id: 5,
        name: 'Modern',
        brand: 'Oakley',
        model: 'Modern',
        code: 'OX 1111',
        price: 160,
        glasses: glassesImage,
      },
      {
        id: 6,
        name: 'Retro',
        brand: 'Oakley',
        model: 'Retro',
        code: 'OX 2222',
        price: 180,
        glasses: glassesImage,
      },
      {
        id: 7,
        name: 'Vintage',
        brand: 'Gucci',
        model: 'Vintage',
        code: 'GU 3333',
        price: 210,
        glasses: glassesImage,
      },
      {
        id: 8,
        name: 'Classic',
        brand: 'Prada',
        model: 'Classic',
        code: 'PR 4444',
        price: 195,
        glasses: glassesImage,
      }
    ];
  
    // Par défaut, on sélectionne la première monture visible (celle du début du carousel)
    const [selectedFrame, setSelectedFrame] = useState(frames[0]);
  
    // Couleurs disponibles pour la monture
    const colors = [
      { name: 'Noir', value: 'black' },
      { name: 'Marron', value: 'brown' },
      { name: 'Bleu', value: 'blue' }
    ];
    const [selectedColor, setSelectedColor] = useState(colors[0].value);
  
    // Montures actuellement visibles dans le carousel (4 à la fois)
    const visibleFrames = frames.slice(carouselIndex, carouselIndex + 4);
  
    // Lorsqu'on change de tranche dans le carousel, si la monture sélectionnée n'est plus visible, on la met à jour
    useEffect(() => {
      if (!visibleFrames.some(frame => frame.id === selectedFrame.id)) {
        setSelectedFrame(frames[carouselIndex]);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [carouselIndex]);
  
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
    }, []);
  
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
            <p className="glasses-code">{selectedFrame.code}</p>
            <p className="glasses-price">
              €{selectedFrame.price} - {colors.find(c => c.value === selectedColor)?.name}
            </p>
            <img
              src={selectedFrame.glasses}
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
                  src={frame.glasses}
                  alt={frame.name}
                  className="glasses-thumbnail"
                />
                <div className="frame-info">
                  <p className="frame-brand">{frame.brand}</p>
                  <p className="frame-model">{frame.model}</p>
                  <p className="frame-code">{frame.code}</p>
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