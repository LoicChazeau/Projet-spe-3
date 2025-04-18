import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FaceShapePage.css';

function FaceShapePage() {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [imageSource, setImageSource] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const navigate = useNavigate();

  // Vérifier si l'API MediaDevices est disponible
  useEffect(() => {
    // Vérifier si le navigateur est en mode sécurisé (HTTPS)
    const isSecureContext = window.isSecureContext;
    console.log("Contexte sécurisé:", isSecureContext);
    
    if (!isSecureContext) {
      setCameraError("L'accès à la webcam nécessite une connexion sécurisée (HTTPS). Veuillez utiliser un navigateur en mode sécurisé.");
      console.error("Le contexte n'est pas sécurisé");
    } else if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Votre navigateur ne prend pas en charge l'accès à la webcam. Veuillez utiliser un navigateur plus récent.");
      console.error("L'API MediaDevices n'est pas disponible");
    }
  }, []);

  // Vérifier si nous sommes en mode développement local
  const isLocalDevelopment = () => {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.includes('.local');
  };

  // Vérifier les permissions de la webcam
  const checkCameraPermissions = async () => {
    try {
      // Vérifier si l'API est disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("L'API MediaDevices n'est pas disponible dans votre navigateur");
      }
      
      // Vérifier si nous sommes en contexte sécurisé
      if (!window.isSecureContext) {
        throw new Error("L'accès à la webcam nécessite une connexion sécurisée (HTTPS)");
      }
      
      // Vérifier les permissions actuelles
      const permissions = await navigator.permissions.query({ name: 'camera' });
      console.log("Statut des permissions de la caméra:", permissions.state);
      
      if (permissions.state === 'denied') {
        throw new Error("L'accès à la webcam a été refusé. Veuillez modifier vos paramètres de confidentialité.");
      }
      
      return true;
    } catch (err) {
      console.error("Erreur lors de la vérification des permissions:", err);
      setCameraError(err.message);
      return false;
    }
  };

  // Initialiser la webcam au chargement du composant
  useEffect(() => {
    if (isCameraActive) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Erreur lors de l'accès à la webcam :", err);
          setCameraError(`Erreur d'accès à la webcam : ${err.message}`);
          setIsCameraActive(false);
        });
    }
  }, [isCameraActive]);

  // Activer la webcam
  const startCamera = () => {
    setIsCameraActive(true);
  };

  // Arrêter la webcam
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Prendre une photo avec la webcam
  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg');
      setUploadedImage(imageData);
      stopCamera();
    }
  };

  // Gérer l'upload de photo
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
        setImageSource('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  // Analyser la forme du visage et obtenir des recommandations
  const analyzeFaceShape = async () => {
    if (!uploadedImage) {
      alert("Veuillez d'abord prendre une photo ou en uploader une.");
      return;
    }

    try {
      // Convertir l'image base64 en Blob
      const base64Response = await fetch(uploadedImage);
      const blob = await base64Response.blob();

      // Créer un FormData et ajouter l'image
      const formData = new FormData();
      formData.append('file', blob, 'image.jpg');

      // Appel à l'API de recommandation
      const response = await fetch('http://localhost:8002/api/v1/recommendation/recommend', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Rediriger vers la page d'essayage avec les données
        navigate('/lia', { 
          state: { 
            faceAnalysis: data.face_analysis,
            recommendations: data.recommendations,
            analyzedImage: uploadedImage,
            isFromAnalysis: true // Indicateur pour TryOnPage
          } 
        });
      } else {
        throw new Error(data.message || "Erreur lors de l'analyse");
      }
    } catch (error) {
      console.error("Erreur lors de l'analyse :", error);
      alert("Une erreur est survenue lors de l'analyse. Veuillez réessayer.");
    }
  };

  return (
    <div className="face-shape-page">
      <button className="back-button" onClick={() => navigate('/home')}>
        <span className="material-icons">arrow_back</span>
      </button>

      <div className="face-shape-container">
        <h1 className="page-title">Analyse de la forme du visage</h1>
        <p className="page-description">
          Prenez une photo de votre visage ou téléchargez-en une pour obtenir des recommandations de montures adaptées à votre morphologie.
        </p>

        <div className="image-capture-section">
          {!uploadedImage ? (
            <>
              {isCameraActive ? (
                <div className="camera-container">
                  <video ref={videoRef} autoPlay className="camera-feed" />
                  <div className="camera-controls">
                    <button className="control-button" onClick={takePhoto}>
                      <span className="material-icons">camera</span>
                      Prendre une photo
                    </button>
                    <button className="control-button" onClick={stopCamera}>
                      <span className="material-icons">close</span>
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="capture-options">
                  {cameraError ? (
                    <div className="error-message">
                      <span className="material-icons">error</span>
                      <p>{cameraError}</p>
                      <button 
                        className="option-button" 
                        onClick={() => fileInputRef.current.click()}
                      >
                        <span className="material-icons">upload_file</span>
                        Télécharger une photo à la place
                      </button>
                    </div>
                  ) : (
                    <>
                      <button className="option-button" onClick={startCamera}>
                        <span className="material-icons">camera_alt</span>
                        Utiliser la webcam
                      </button>
                      <button 
                        className="option-button" 
                        onClick={() => fileInputRef.current.click()}
                      >
                        <span className="material-icons">upload_file</span>
                        Télécharger une photo
                      </button>
                    </>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="preview-container">
              <img src={uploadedImage} alt="Visage" className="preview-image" />
              <div className="preview-controls">
                <button 
                  className="control-button" 
                  onClick={() => setUploadedImage(null)}
                >
                  <span className="material-icons">refresh</span>
                  Reprendre
                </button>
                <button 
                  className="control-button primary" 
                  onClick={analyzeFaceShape}
                >
                  <span className="material-icons">analytics</span>
                  Analyser
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FaceShapePage; 