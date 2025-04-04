import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import logo from './assets/logo.svg';
import './App.css';
import Auth from './Components/Auth';
import Home from './Components/Home';
import Lia from './Components/TryOnPage'
import VideoTest from './pages/VideoTest';

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
      <Link className="App-link" to="/video-test">
        Test Vidéo
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
          <Route path="/video-test" element={<VideoTest />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
