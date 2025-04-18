import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import logo from './assets/logo.svg';
import './App.css';
import Auth from './components/Auth';
import Home from './components/Home';
import Lia from './components/TryOnPage'
import VideoTest from './pages/VideoTest';
import ModelTest from './pages/ModelTest';
import ProtectedRoute from './components/ProtectedRoute';
import FaceShapePage from './components/FaceShapePage';
import WebGLTest from './pages/WebGLTest';
import GltfTest from './pages/GltfTest';
import WebGLVideoTest from './pages/WebGLVideoTest';

function HomePage() {
  return (
    <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />
      <p>
        Bienvenue sur notre application ! 
      </p>
      <Link className="App-link" to="/login">
        Connexion
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
          
          {/* Routes protégées */}
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/lia" element={
            <ProtectedRoute>
              <Lia />
            </ProtectedRoute>
          } />
          <Route path="/face-shape" element={
            <ProtectedRoute>
              <FaceShapePage />
            </ProtectedRoute>
          } />
          <Route path="/video-test" element={
            <ProtectedRoute>
              <VideoTest />
            </ProtectedRoute>
          } />
          <Route path="/model-test" element={
            <ProtectedRoute>
              <ModelTest />
            </ProtectedRoute>
          } />
          <Route path="/webgl-test" element={
            <ProtectedRoute>
              <WebGLTest />
            </ProtectedRoute>
          } />
          <Route path="/gltf-test" element={
            <ProtectedRoute>
              <GltfTest />
            </ProtectedRoute>
          } />
          <Route path="/webgl-video-test" element={
            <ProtectedRoute>
              <WebGLVideoTest />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
