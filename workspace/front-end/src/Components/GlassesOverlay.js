import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

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
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Éclairage
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    // Charger le modèle 3D
    const mtlLoader = new MTLLoader();
    console.log('Début du chargement du modèle oculos...');
    
    mtlLoader.load(
      '/models/oculos.mtl',
      (materials) => {
        console.log('MTL chargé avec succès');
        materials.preload();
        
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        
        objLoader.load(
          '/models/oculos.obj',
          (object) => {
            console.log('OBJ chargé avec succès');
            
            // Centrer le modèle
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            object.position.sub(center);
            
            // Position fixe au centre
            object.position.set(0, 0, 0);
            
            // Rotation pour voir les lunettes de face
            object.rotation.set(
              0,           // X : pas de rotation
              Math.PI,     // Y : retourner le modèle de 180°
              0            // Z : pas de rotation
            );
            
            // Échelle avec des valeurs différentes pour chaque axe
            object.scale.set(
              45,  // X : largeur
              45,  // Y : hauteur
              30   // Z : profondeur (plus petit pour éviter la déformation des branches)
            );
            
            modelRef.current = object;
            scene.add(object);
            console.log('Modèle ajouté à la scène');
          },
          (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% chargé');
          },
          (error) => {
            console.error('Erreur lors du chargement de l\'OBJ:', error);
          }
        );
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% MTL chargé');
      },
      (error) => {
        console.error('Erreur lors du chargement du MTL:', error);
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
          if (object.material) object.material.dispose();
        }
      }
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