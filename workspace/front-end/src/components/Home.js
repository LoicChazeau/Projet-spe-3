import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import Modal from '../components/Modal';
import './Home.css';
import woman_sunglasses from '../assets/woman-sunglasses.jpeg';
import oakleyLogo from '../assets/logo_oakley.svg';
import raybanLogo from '../assets/logo_ray-ban.svg';
import pradaLogo from '../assets/logo_prada.svg';
import gucciLogo from '../assets/logo_gucci.svg';
import glasses from '../assets/Lunettes_LUKKAS.png';

// Configuration de l'API
const API_BASE_URL = 'http://localhost:8002/api/v1/recommendation';

// Logos des marques
const brandLogos = [
  { name: 'Ray-Ban', logo: raybanLogo },
  { name: 'Oakley', logo: oakleyLogo },
  { name: 'Gucci', logo: gucciLogo },
  { name: 'Prada', logo: pradaLogo },
];

function Home() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour récupérer les lunettes
  const fetchGlasses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/glasses`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des lunettes');
      const data = await response.json();
      setNewArrivals(data);
    } catch (err) {
      setError(err.message);
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les catégories
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des catégories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError(err.message);
      console.error('Erreur:', err);
    }
  };

  useEffect(() => {
    fetchGlasses();
    fetchCategories();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (error) {
    return <div className="error">Erreur: {error}</div>;
  }

  return (
    <div className="face-shape-page">
      {/* Bouton de déconnexion */}
      <button 
        onClick={() => setShowLogoutModal(true)}
        className="logout-button"
      >
        Déconnexion
      </button>

      {/* Modal de confirmation de déconnexion */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Confirmation de déconnexion"
        message="Êtes-vous sûr de vouloir vous déconnecter ?"
      />

      <div className="face-shape-container">
        {/* Top Banner */}
        <div className="top-banner">
          <img
            src={woman_sunglasses}
            alt="Femme portant des lunettes"
            className="banner-image"
          />
          <div className="banner-text">
            <h2 className="banner-title">Trouvez la monture qui vous ressemble</h2>
            <div className="banner-buttons">
              <button className="banner-button" onClick={() => navigate('/lia')}>Essayer Lia</button>
              <button className="banner-button secondary" onClick={() => navigate('/face-shape')}>Analyser ma forme de visage</button>
            </div>
          </div>
        </div>

        {/* Section des logos de marques cliquables */}
        <div className="brand-logos-section">
          {brandLogos.map((brand, index) => (
            <a
              key={index}
              href={`/brand/${brand.name.toLowerCase()}`}
              className="brand-link"
            >
              <div className="brand-logo-container">
                <div className="brand-logo-wrapper">
                  <img src={brand.logo} alt={brand.name} className="brand-logo" />
                </div>
                <p>{brand.name}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Nouveauté */}
        <div className="new-arrivals-section">
          <div className="section-header">
            <h3>Nouveauté</h3>
            <a href="#voir-tout" className="see-all-link">
              Voir tout
            </a>
          </div>

          <div className="product-grid">
            {newArrivals.map((product, index) => (
              <div key={index} className="product-card">
                <img
                  src={product.images?.[0] || glasses}
                  alt={`${product.brand} ${product.model}`}
                  className="product-image"
                />
                <div className="product-info">
                  <p className="product-brand">{product.brand}</p>
                  <p className="product-model">{product.model}</p>
                  <p className="product-code">{product.ref}</p>
                  <p className="product-price">À partir de {product.price}€</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
