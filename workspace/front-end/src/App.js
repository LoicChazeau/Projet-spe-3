import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import logo from './assets/logo.svg';
import './App.css';
import Auth from './components/Auth';
import Home from './components/Home';
import Lia from './components/TryOnPage'
import VideoTest from './pages/VideoTest';
import ModelTest from './pages/ModelTest';
import FaceShapePage from './components/FaceShapePage';

function HomePage() {
  return (
    <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />
      <p>
        Bvn sur notre application ! 
      </p>
      <Link className="App-link" to="/login">
        Connexion
      </Link>
      <Link className="App-link" to="/home">
        Home
      </Link>
      <Link className="App-link" to="/lia">
        Lia
      </Link>
      <Link className="App-link" to="/face-shape">
        Analyse de la forme du visage
      </Link>
      <Link className="App-link" to="/video-test">
        Test Vidéo
      </Link>
      <Link className="App-link" to="/model-test">
        Test Modèle 3D
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
          <Route path="/home" element={<Home />} />
          <Route path="/lia" element={<Lia />} />
          <Route path="/face-shape" element={<FaceShapePage />} />
          <Route path="/video-test" element={<VideoTest />} />
          <Route path="/model-test" element={<ModelTest />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
