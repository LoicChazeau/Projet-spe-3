import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const ModelTest = () => {
  const containerRef = useRef(null);
  const modelRef = useRef(null);
  const sceneRef = useRef(null);
  const [status, setStatus] = useState('Initialisation...');
  const [selectedModel, setSelectedModel] = useState('oculos');
  const [controls, setControls] = useState({
    scale: 1,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    positionX: 0,
    positionY: 0,
    positionZ: 0
  });

  const MODELS = {
    glasses: {
      name: 'glasses',
      scale: 50
    },
    oculos: {
      name: 'oculos',
      scale: 50
    }
  };

  const loadModel = (scene, modelName) => {
    console.log('Tentative de chargement du modèle:', modelName);
    
    // Supprimer l'ancien modèle s'il existe
    if (modelRef.current) {
      console.log('Suppression de l\'ancien modèle');
      scene.remove(modelRef.current);
      modelRef.current = null;
    }

    setStatus(`Chargement du modèle ${modelName}...`);

    const mtlLoader = new MTLLoader();
    console.log('Chargement du MTL:', `/models/${modelName}.mtl`);
    
    mtlLoader.load(
      `/models/${modelName}.mtl`,
      (materials) => {
        console.log('Matériaux chargés avec succès pour:', modelName);
        setStatus(`Matériaux de ${modelName} chargés, chargement du modèle...`);
        materials.preload();

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        console.log('Chargement du OBJ:', `/models/${modelName}.obj`);

        objLoader.load(
          `/models/${modelName}.obj`,
          (object) => {
            console.log('Objet 3D chargé avec succès:', modelName);
            setStatus(`Modèle ${modelName} chargé avec succès`);
            
            // Centrer le modèle
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            object.position.sub(center);

            // Échelle initiale selon le modèle
            const modelConfig = MODELS[modelName] || MODELS.glasses;
            object.scale.setScalar(modelConfig.scale);

            scene.add(object);
            modelRef.current = object;
            console.log('Modèle ajouté à la scène:', modelName);
          },
          (xhr) => {
            const progress = (xhr.loaded / xhr.total * 100).toFixed(0);
            console.log(`Progression OBJ ${modelName}:`, progress + '%');
            setStatus(`Chargement du modèle ${modelName}: ${progress}%`);
          },
          (error) => {
            console.error('Erreur détaillée lors du chargement OBJ:', error);
            setStatus(`Erreur de chargement de ${modelName}: ${error.message}`);
          }
        );
      },
      (xhr) => {
        const progress = (xhr.loaded / xhr.total * 100).toFixed(0);
        console.log(`Progression MTL ${modelName}:`, progress + '%');
        setStatus(`Chargement des matériaux de ${modelName}: ${progress}%`);
      },
      (error) => {
        console.error('Erreur détaillée lors du chargement MTL:', error);
        setStatus(`Erreur de chargement des matériaux de ${modelName}: ${error.message}`);
      }
    );
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Configuration de base
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x333333);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.set(0, 0, 50);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Contrôles de la caméra
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;

    // Éclairage
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    // Grille et axes
    const gridHelper = new THREE.GridHelper(100, 10);
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(50);
    scene.add(axesHelper);

    // Charger le modèle initial
    loadModel(scene, selectedModel);

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      orbitControls.update();

      if (modelRef.current) {
        modelRef.current.scale.setScalar(controls.scale * 50);
        modelRef.current.rotation.set(
          controls.rotationX * Math.PI,
          controls.rotationY * Math.PI,
          controls.rotationZ * Math.PI
        );
        modelRef.current.position.set(
          controls.positionX * 10,
          controls.positionY * 10,
          controls.positionZ * 10
        );
      }

      renderer.render(scene, camera);
    };
    animate();

    // Gestion du redimensionnement
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [controls]); // Ajout de controls comme dépendance

  // Effet pour gérer le changement de modèle
  useEffect(() => {
    console.log('selectedModel a changé:', selectedModel);
    if (sceneRef.current) {
      console.log('Appel de loadModel avec:', selectedModel);
      loadModel(sceneRef.current, selectedModel);
    }
  }, [selectedModel]);

  const handleControlChange = (e) => {
    const { name, value } = e.target;
    setControls(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: 20,
        borderRadius: 5
      }}>
        <h3>Status: {status}</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <button onClick={() => setSelectedModel('glasses')}>
              Lunettes
            </button>
            <button onClick={() => setSelectedModel('oculos')}>
              Oculos
            </button>
            <button onClick={() => {
              setControls({
                scale: 1,
                rotationX: 0,
                rotationY: 0,
                rotationZ: 0,
                positionX: 0,
                positionY: 0,
                positionZ: 0
              });
            }}>Réinitialiser</button>
          </div>
          <label>
            Échelle:
            <input
              type="range"
              name="scale"
              min="0.1"
              max="10"
              step="0.1"
              value={controls.scale}
              onChange={handleControlChange}
            />
            {controls.scale}
          </label>
          
          {['X', 'Y', 'Z'].map(axis => (
            <div key={axis}>
              <label>
                Rotation {axis}:
                <input
                  type="range"
                  name={`rotation${axis}`}
                  min="-2"
                  max="2"
                  step="0.1"
                  value={controls[`rotation${axis}`]}
                  onChange={handleControlChange}
                />
                {controls[`rotation${axis}`]}π
              </label>
              <label>
                Position {axis}:
                <input
                  type="range"
                  name={`position${axis}`}
                  min="-10"
                  max="10"
                  step="0.1"
                  value={controls[`position${axis}`]}
                  onChange={handleControlChange}
                />
                {controls[`position${axis}`]}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModelTest; 