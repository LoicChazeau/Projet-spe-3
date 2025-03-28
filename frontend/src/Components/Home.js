import React from 'react';
import './Home.css';
import woman_sunglasses from '../assets/woman-sunglasses.jpeg';
import oakleyLogo from '../assets/logo_oakley.svg';
import raybanLogo from '../assets/logo_ray-ban.svg';
import pradaLogo from '../assets/logo_prada.svg';
import gucciLogo from '../assets/logo_gucci.svg';
import glasses from '../assets/Lunettes_LUKKAS.svg';

// Exemple de données (logos, produits)
const brandLogos = [
  { name: 'Ray-Ban', logo: raybanLogo },
  { name: 'Oakley', logo: oakleyLogo },
  { name: 'Gucci', logo: gucciLogo },
  { name: 'Prada', logo: pradaLogo },
];

const newArrivals = [
  {
    brand: 'Ray-Ban',
    model: 'Wayfarer',
    code: 'LU 2305 NODO 51/21',
    price: 172,
    image: glasses,
  },
  {
    brand: 'Ray-Ban',
    model: 'Wayfarer',
    code: 'LU 2305 NODO 51/21',
    price: 172,
    image: glasses,
  },
  {
    brand: 'Ray-Ban',
    model: 'Wayfarer',
    code: 'LU 2305 NODO 51/21',
    price: 172,
    image: glasses,
  },
  {
    brand: 'Ray-Ban',
    model: 'Wayfarer',
    code: 'LU 2305 NODO 51/21',
    price: 172,
    image: glasses,
  },
  {
    brand: 'Ray-Ban',
    model: 'Wayfarer',
    code: 'LU 2305 NODO 51/21',
    price: 172,
    image: glasses,
  },
  {
    brand: 'Ray-Ban',
    model: 'Wayfarer',
    code: 'LU 2305 NODO 51/21',
    price: 172,
    image: glasses,
  },
  {
    brand: 'Ray-Ban',
    model: 'Wayfarer',
    code: 'LU 2305 NODO 51/21',
    price: 172,
    image: glasses,
  },
  {
    brand: 'Ray-Ban',
    model: 'Wayfarer',
    code: 'LU 2305 NODO 51/21',
    price: 172,
    image: glasses,
  },
  
];

function Home() {
  return (
    <div className="home-page">
      {/* Top Banner */}
      <div className="top-banner">
        <img
          src={woman_sunglasses}
          alt="Femme portant des lunettes"
          className="banner-image"
        />
        <div className="banner-text">
          <h2 className="banner-title">Trouvez la monture qui vous ressemble</h2>
          <button className="banner-button">Essayer Lia</button>
        </div>
      </div>

      {/* Marque logos 
      <div className="brand-logos-section">
        {brandLogos.map((item) => (
          <div key={item.name} className="brand-logo-container">
            <img src={item.logo} alt={item.name} className="brand-logo" />
            <p>{item.name}</p>
          </div>
        ))}
      </div>*/}

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
                src={product.image}
                alt={`${product.brand} ${product.model}`}
                className="product-image"
              />
              <div className="product-info">
                <p className="product-brand">{product.brand}</p>
                <p className="product-model">{product.model}</p>
                <p className="product-code">{product.code}</p>
                <p className="product-price">À partir de {product.price}€</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav (exemple) */}
      <div className="bottom-nav">
        <div className="nav-item">Accueil</div>
        <div className="nav-item">Produit</div>
        <div className="nav-item">Shop</div>
        <div className="nav-item">Compte</div>
      </div>
    </div>
  );
}

export default Home;
