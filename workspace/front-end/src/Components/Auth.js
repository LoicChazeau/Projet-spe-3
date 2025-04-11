import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import '../App.css'; // Remonte d'un niveau
import './Auth.css';
import logo from '../assets/logo.svg'; // Si votre logo est dans src

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/home'); // Redirection après connexion réussie
    } catch (error) {
      setError('Identifiants incorrects. Veuillez réessayer.');
      console.error('Erreur de connexion:', error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Logo */}
        <img src={logo} alt="Logo Optic" className="optic-logo" />

        {/* Nom et slogan de la marque */}
        <h1 className="brand-name">OPTIC</h1>
        <p className="brand-tagline">UNE VISION EN HAUTE DÉFINITION</p>

        {error && <div className="error-message">{error}</div>}

        {/* Formulaire de connexion */}
        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre email"
            required
          />

          <label htmlFor="password">Mot de passe</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
            required
          />

          <button type="submit">CONNEXION</button>
        </form>
      </div>
    </div>
  );
}

export default Auth;
