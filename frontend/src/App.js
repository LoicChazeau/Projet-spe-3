import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import logo from './Assets/logo.svg';
import './App.css';
import Auth from './Components/Auth';

function HomePage() {
  return (
    <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />
      <p>
        Salut les bouffons !  <br/> Je vous fait les pages en dessous après vous vous demerdez à les connecter entre elles
      </p>
      <Link className="App-link" to="/login">
        Aller à la page de connexion
      </Link>
    </header>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
