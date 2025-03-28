import React from 'react';
import '../App.css'; // Remonte d'un niveau
import './Auth.css';
import logo from '../Assets/logo.svg'; // Si votre logo est dans src



function Auth() {
  const handleSubmit = (event) => {
    event.preventDefault();
    // Ajoute ici la logique de connexion
    console.log('Connexion en cours...');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Logo */}
        <img src={logo} alt="Logo Optic" className="optic-logo" />

        {/* Nom et slogan de la marque */}
        <h1 className="brand-name">OPTIC</h1>
        <p className="brand-tagline">UNE VISION EN HAUTE DÉFINITION</p>

        {/* Formulaire de connexion */}
        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="identifiant">Identifiant client</label>
          <input
            type="text"
            id="identifiant"
            name="identifiant"
            placeholder=""
            required
          />

          <label htmlFor="password">Mot de passe</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder=""
            required
          />

          <button type="submit">CONNEXION</button>
        </form>
      </div>
    </div>
  );
}

export default Auth;
