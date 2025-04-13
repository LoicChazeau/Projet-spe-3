import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const GlassesOverlay = ({ canvasWidth, canvasHeight }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);

  // Initialisation de Three.js
  useEffect(() => {
    if (!containerRef.current) return;

    // Créer la scène
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Créer la caméra
    const camera = new THREE.PerspectiveCamera(45, canvasWidth / canvasHeight, 0.1, 2000);
    camera.position.set(0, 0, 200);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Créer le renderer avec fond transparent
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setSize(canvasWidth, canvasHeight);
    renderer.setClearColor(0x000000, 0); // Fond transparent
    renderer.outputColorSpace = THREE.SRGBColorSpace; // Nouvelle syntaxe
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Éclairage
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Ajouter une lumière d'appoint pour les reflets
    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(-1, 1, -1);
    scene.add(backLight);

    // Créer un environnement pour les reflets
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = new THREE.CubeTextureLoader().load([
      '/models/glasses/textures/px.jpg',
      '/models/glasses/textures/nx.jpg',
      '/models/glasses/textures/py.jpg',
      '/models/glasses/textures/ny.jpg',
      '/models/glasses/textures/pz.jpg',
      '/models/glasses/textures/nz.jpg'
    ]);
    const envMap = pmremGenerator.fromCubemap(envTexture).texture;
    scene.environment = envMap;
    pmremGenerator.dispose();

    // Charger le modèle GLTF
    const loader = new GLTFLoader();
    console.log('Début du chargement du modèle GLTF...');
    
    loader.load(
      '/models/glasses/source/Glasses.gltf',
      (gltf) => {
        console.log('GLTF chargé avec succès');
        const model = gltf.scene;
        
        // Appliquer les matériaux et textures
        model.traverse((node) => {
          if (node.isMesh) {
            // Activer les ombres
            node.castShadow = true;
            node.receiveShadow = true;

            // Si le matériau existe déjà
            if (node.material) {
              // Créer un nouveau matériau PBR
              const material = new THREE.MeshPhysicalMaterial({
                color: node.material.color || 0x000000,
                metalness: 0.6,
                roughness: 0.2,
                clearcoat: 0.4,
                clearcoatRoughness: 0.2,
                envMap: envMap,
                envMapIntensity: 1.0,
                side: THREE.DoubleSide
              });

              // Copier les textures existantes si elles existent
              if (node.material.map) material.map = node.material.map;
              if (node.material.normalMap) material.normalMap = node.material.normalMap;
              
              node.material = material;
            }
          }
        });
        
        // Centrer le modèle
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        
        // Position fixe au centre
        model.position.set(0, 0, 0);
        
        // Rotation pour voir les lunettes de face
        model.rotation.set(
          0,           // X : pas de rotation
          Math.PI,     // Y : retourner le modèle de 180°
          0            // Z : pas de rotation
        );
        
        // Échelle initiale
        model.scale.set(45, 45, 45);
        
        modelRef.current = model;
        scene.add(model);
        console.log('Modèle ajouté à la scène');
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% chargé');
      },
      (error) => {
        console.error('Erreur lors du chargement du GLTF:', error);
      }
    );

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Nettoyage
    return () => {
      if (renderer && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      if (scene) {
        while(scene.children.length > 0){ 
          const object = scene.children[0];
          scene.remove(object);
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      }
      if (envMap) envMap.dispose();
    };
  }, [canvasWidth, canvasHeight]);

  return (
    <div 
      ref={containerRef} 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: canvasWidth,
        height: canvasHeight,
        pointerEvents: 'none',
        zIndex: 10
      }}
    />
  );
};

export default GlassesOverlay; 