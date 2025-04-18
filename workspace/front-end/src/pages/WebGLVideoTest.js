import React, { useRef, useEffect, useState, useCallback } from 'react';
import { load } from '@loaders.gl/core';
import { GLTFLoader } from '@loaders.gl/gltf';
import './WebGLVideoTest.css';

const WebGLVideoTest = () => {
  // Refs pour les éléments du DOM
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const glRef = useRef(null);
  const programRef = useRef(null);
  const modelRef = useRef(null);

  // États
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 });
  const [facePosition, setFacePosition] = useState(null);
  const [faceScale, setFaceScale] = useState(0.8);
  const [measurements, setMeasurements] = useState([]);

  // Ajout d'un canvas 2D pour les landmarks
  const landmarksCanvasRef = useRef(null);

  // Shaders
  const vertexShaderSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec2 aTexCoord;
    
    uniform mat4 uModelMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjectionMatrix;
    
    varying vec3 vNormal;
    varying vec2 vTexCoord;
    
    void main() {
      vNormal = mat3(uModelMatrix) * aNormal;
      vTexCoord = aTexCoord;
      gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;
    
    varying vec3 vNormal;
    varying vec2 vTexCoord;
    
    uniform vec3 uLightDirection;
    uniform vec4 uBaseColor;
    
    void main() {
      vec3 normal = normalize(vNormal);
      
      // Lumière ambiante plus forte
      float ambientLight = 0.5;
      
      // Lumière directionnelle plus douce
      float directionalLight = max(dot(normal, normalize(uLightDirection)), 0.0) * 0.5;
      
      // Combinaison des lumières
      float totalLight = ambientLight + directionalLight;
      
      // Utilisation directe de la couleur de base
      gl_FragColor = vec4(uBaseColor.rgb * totalLight, uBaseColor.a);
    }
  `;

  // Initialisation WebGL
  useEffect(() => {
    const initWebGL = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.error('[WebGL] Canvas non trouvé');
        return;
      }

      const gl = canvas.getContext('webgl', {
        alpha: true,
        premultipliedAlpha: false,
        antialias: true
      });

      if (!gl) {
        console.error('[WebGL] WebGL non supporté');
        return;
      }

      // Configuration WebGL
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0.0, 0.0, 0.0, 0.0);

      // Création et compilation des shaders
      const createShader = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error('Erreur de compilation du shader:', gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
      const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

      if (!vertexShader || !fragmentShader) {
        return;
      }

      // Création du programme
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Erreur de liaison du programme:', gl.getProgramInfoLog(program));
        return;
      }

      gl.useProgram(program);
      programRef.current = program;
      glRef.current = gl;

      // Configuration des matrices avec des valeurs plus adaptées
      const fieldOfView = 30 * Math.PI / 180;  // Réduction du champ de vision
      const aspect = canvas.width / canvas.height;
      const zNear = 0.1;
      const zFar = 100.0;

      // Matrice de projection
      const projectionMatrix = new Float32Array(16);
      const f = 1.0 / Math.tan(fieldOfView / 2);
      projectionMatrix[0] = f / aspect;
      projectionMatrix[5] = f;
      projectionMatrix[10] = (zFar + zNear) / (zNear - zFar);
      projectionMatrix[11] = -1;
      projectionMatrix[14] = 2 * zFar * zNear / (zNear - zFar);

      // Matrice de vue - Reculer la caméra
      const viewMatrix = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, -10, 1  // Déplacer la caméra plus loin
      ]);

      // Matrice du modèle - Position initiale plus proche
      const modelMatrix = new Float32Array([
        0.1, 0, 0, 0,    // Scale X réduit à 0.1
        0, 0.1, 0, 0,    // Scale Y réduit à 0.1
        0, 0, 0.1, 0,    // Scale Z réduit à 0.1
        0, 0, -2, 1      // Position Z plus proche
      ]);

      // Application des uniformes
      const uModelMatrix = gl.getUniformLocation(program, 'uModelMatrix');
      const uViewMatrix = gl.getUniformLocation(program, 'uViewMatrix');
      const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
      const uLightDirection = gl.getUniformLocation(program, 'uLightDirection');

      gl.uniformMatrix4fv(uModelMatrix, false, modelMatrix);
      gl.uniformMatrix4fv(uViewMatrix, false, viewMatrix);
      gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
      gl.uniform3fv(uLightDirection, new Float32Array([0.0, -1.0, 1.0]));  // Ajustement de la direction de la lumière

      console.log('[WebGL] Initialisation réussie');
    };

    initWebGL();
  }, []);

  // Chargement du modèle
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('Début du chargement du modèle GLTF...');
        const gltf = await load('/models/glasses/source/glasses.gltf', GLTFLoader);
        
        console.log('Structure GLTF:', gltf);
        console.log('Matériaux:', gltf.json.materials);

        const gl = glRef.current;
        if (!gl) {
          console.error('WebGL non disponible');
          return;
        }

        const meshes = gltf.json.meshes;
        if (!meshes || meshes.length === 0) {
          throw new Error('Pas de mesh trouvé dans le fichier GLTF');
        }

        // Structure pour stocker tous les buffers et informations de rendu
        const modelBuffers = [];

        // Traiter chaque mesh
        for (const mesh of meshes) {
          console.log('Traitement du mesh:', mesh);
          for (const primitive of mesh.primitives) {
            const bufferInfo = {};

            // Positions
            const positionAccessor = gltf.json.accessors[primitive.attributes.POSITION];
            const positionBufferView = gltf.json.bufferViews[positionAccessor.bufferView];
            const positionBuffer = gltf.buffers[positionBufferView.buffer];
            
            const glPositionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, glPositionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionBuffer.arrayBuffer), gl.STATIC_DRAW);
            bufferInfo.positionBuffer = glPositionBuffer;
            bufferInfo.positionBufferView = positionBufferView;
            bufferInfo.positionAccessor = positionAccessor;

            // Normales
            if (primitive.attributes.NORMAL !== undefined) {
              const normalAccessor = gltf.json.accessors[primitive.attributes.NORMAL];
              const normalBufferView = gltf.json.bufferViews[normalAccessor.bufferView];
              const normalBuffer = gltf.buffers[normalBufferView.buffer];
              
              const glNormalBuffer = gl.createBuffer();
              gl.bindBuffer(gl.ARRAY_BUFFER, glNormalBuffer);
              gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalBuffer.arrayBuffer), gl.STATIC_DRAW);
              bufferInfo.normalBuffer = glNormalBuffer;
              bufferInfo.normalBufferView = normalBufferView;
              bufferInfo.normalAccessor = normalAccessor;
            }

            // Indices
            const indexAccessor = gltf.json.accessors[primitive.indices];
            const indexBufferView = gltf.json.bufferViews[indexAccessor.bufferView];
            const indexBuffer = gltf.buffers[indexBufferView.buffer];
            
            const glIndexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glIndexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexBuffer.arrayBuffer), gl.STATIC_DRAW);
            bufferInfo.indexBuffer = glIndexBuffer;
            bufferInfo.indexCount = indexAccessor.count;

            // Matériau
            if (primitive.material !== undefined) {
              const material = gltf.json.materials[primitive.material];
              console.log('Matériau trouvé:', material);

              // Attribution des couleurs en fonction du nom du matériau
              if (material.name === 'Frame') {
                // Monture principale en gris foncé métallique
                bufferInfo.baseColor = [0.3, 0.3, 0.3, 1.0];
              } else if (material.name === 'Handles') {
                // Branches en noir mat
                bufferInfo.baseColor = [0.1, 0.1, 0.1, 1.0];
              } else if (material.name === 'Frame.1') {
                // Partie transparente en gris clair semi-transparent
                bufferInfo.baseColor = [0.9, 0.9, 0.9, 0.5];
              } else {
                // Couleur par défaut
                bufferInfo.baseColor = [0.8, 0.8, 0.8, 1.0];
              }
              console.log(`Couleur assignée pour ${material.name}:`, bufferInfo.baseColor);
            }

            modelBuffers.push(bufferInfo);
          }
        }

        modelRef.current = {
          buffers: modelBuffers,
          cleanup: () => {
            modelBuffers.forEach(bufferInfo => {
              gl.deleteBuffer(bufferInfo.positionBuffer);
              if (bufferInfo.normalBuffer) {
                gl.deleteBuffer(bufferInfo.normalBuffer);
              }
              gl.deleteBuffer(bufferInfo.indexBuffer);
            });
          }
        };

      } catch (error) {
        console.error('Erreur détaillée lors du chargement du modèle:', error);
        console.error('Stack trace:', error.stack);
      }
    };

    loadModel();
  }, []);

  // Initialisation WebSocket et Webcam
  useEffect(() => {
    // Initialisation WebSocket
    wsRef.current = new WebSocket('ws://localhost:8001/api/v1/face/ws');

    wsRef.current.onopen = () => {
      console.log('[WebSocket] Connecté avec succès');
      setIsConnected(true);
      setError(null);
    };

    wsRef.current.onclose = () => {
      console.log('[WebSocket] Déconnecté');
      setIsConnected(false);
    };

    wsRef.current.onerror = (error) => {
      console.error('[WebSocket] Erreur:', error);
      setError('Erreur de connexion au serveur');
    };

    // Initialisation Webcam
    console.log('[Webcam] Tentative d\'accès à la webcam...');
    navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    })
    .then(stream => {
      console.log('[Webcam] Accès obtenu avec succès');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log('[Webcam] Métadonnées chargées:', {
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight
          });
          setDimensions({
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight
          });
        };
        
        // Ajout d'un gestionnaire pour s'assurer que la vidéo démarre
        videoRef.current.oncanplay = () => {
          console.log('[Webcam] Vidéo prête à être lue');
          videoRef.current.play().catch(e => {
            console.error('[Webcam] Erreur lors du démarrage de la vidéo:', e);
          });
        };
      }
    })
    .catch(err => {
      console.error('[Webcam] Erreur d\'accès:', err);
      setError('Impossible d\'accéder à la webcam');
    });

    // Nettoyage
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => {
          console.log('[Webcam] Arrêt de la piste:', track.label);
          track.stop();
        });
      }
    };
  }, []);

  const drawLandmarks = (landmarks, ctx) => {
    if (!landmarks || !ctx) return;
    
    // Effacer le canvas des landmarks
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    // Dessiner les landmarks
    ctx.fillStyle = '#00FF00';
    landmarks.landmarks.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // Fonction utilitaire pour calculer la taille du visage
  const calculateFaceScale = (landmarks) => {
    if (!landmarks || !landmarks.landmarks || landmarks.landmarks.length === 0) {
      return null;
    }

    // Points pour les yeux
    const leftEyePoints = landmarks.landmarks.slice(130, 140);
    const rightEyePoints = landmarks.landmarks.slice(360, 370);

    if (leftEyePoints.length === 0 || rightEyePoints.length === 0) {
      return null;
    }

    // Calculer les centres des yeux
    const leftEyeCenter = {
      x: leftEyePoints.reduce((sum, p) => sum + p.x, 0) / leftEyePoints.length,
      y: leftEyePoints.reduce((sum, p) => sum + p.y, 0) / leftEyePoints.length
    };

    const rightEyeCenter = {
      x: rightEyePoints.reduce((sum, p) => sum + p.x, 0) / rightEyePoints.length,
      y: rightEyePoints.reduce((sum, p) => sum + p.y, 0) / rightEyePoints.length
    };

    // Points pour calculer la largeur totale du visage
    const leftFacePoints = landmarks.landmarks.slice(0, 10);
    const rightFacePoints = landmarks.landmarks.slice(400, 410);

    // Trouver les points les plus externes du visage
    const leftMostX = Math.min(...leftFacePoints.map(p => p.x));
    const rightMostX = Math.max(...rightFacePoints.map(p => p.x));

    // Calculer la largeur totale du visage
    const faceWidth = rightMostX - leftMostX;

    // Points pour les sourcils et le nez
    const leftEyebrowPoints = landmarks.landmarks.slice(70, 80);
    const rightEyebrowPoints = landmarks.landmarks.slice(300, 310);
    const noseBottomPoints = landmarks.landmarks.slice(220, 230);

    // Calculer la position moyenne des sourcils
    const leftEyebrowY = leftEyebrowPoints.reduce((sum, p) => sum + p.y, 0) / leftEyebrowPoints.length;
    const rightEyebrowY = rightEyebrowPoints.reduce((sum, p) => sum + p.y, 0) / rightEyebrowPoints.length;
    const eyebrowY = Math.min(leftEyebrowY, rightEyebrowY); // Prendre le plus haut des deux sourcils

    const noseY = noseBottomPoints.reduce((sum, p) => sum + p.y, 0) / noseBottomPoints.length;

    // Augmenter la hauteur pour mieux couvrir la zone des yeux
    const idealHeight = Math.abs(noseY - eyebrowY) * 1.4; // Réduit de 2.0 à 1.4

    // Calculer les scales avec des facteurs plus importants
    const widthScale = (faceWidth / dimensions.width) * 7.5;  // On garde la largeur actuelle
    const heightScale = (idealHeight / dimensions.height) * 6; // Réduit de 8 à 6

    // Appliquer un facteur minimum pour éviter que les lunettes ne soient trop petites
    const minScale = 1.2;
    const finalWidthScale = Math.max(widthScale, minScale);
    const finalHeightScale = Math.max(heightScale, minScale);

    return {
      widthScale: finalWidthScale,
      heightScale: finalHeightScale,
      debug: {
        faceWidth,
        idealHeight,
        originalWidthScale: widthScale,
        originalHeightScale: heightScale,
        finalWidthScale,
        finalHeightScale
      }
    };
  };

  // Fonction de mise à jour de la position du modèle
  const updateModelPosition = (landmarks) => {
    if (!landmarks || !landmarks.landmarks || landmarks.landmarks.length === 0) return;

    // Utiliser les landmarks des yeux pour une position plus précise
    // Landmarks pour les yeux (indices approximatifs, à ajuster selon votre modèle)
    const leftEyePoints = landmarks.landmarks.slice(130, 140); // Points du contour de l'œil gauche
    const rightEyePoints = landmarks.landmarks.slice(360, 370); // Points du contour de l'œil droit

    if (leftEyePoints.length === 0 || rightEyePoints.length === 0) return;

    // Calculer le centre de chaque œil
    const leftEyeCenter = {
      x: leftEyePoints.reduce((sum, p) => sum + p.x, 0) / leftEyePoints.length,
      y: leftEyePoints.reduce((sum, p) => sum + p.y, 0) / leftEyePoints.length
    };

    const rightEyeCenter = {
      x: rightEyePoints.reduce((sum, p) => sum + p.x, 0) / rightEyePoints.length,
      y: rightEyePoints.reduce((sum, p) => sum + p.y, 0) / rightEyePoints.length
    };

    // Calculer le point central entre les deux yeux
    const centerX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
    const centerY = (leftEyeCenter.y + rightEyeCenter.y) / 2;

    // Convertir les coordonnées 2D en coordonnées 3D
    // Normaliser les coordonnées entre -1 et 1
    const normalizedX = (centerX / dimensions.width) * 2 - 1;
    const normalizedY = -(centerY / dimensions.height) * 2 + 1;

    // Mettre à jour la position du visage
    setFacePosition({
      x: normalizedX,
      y: normalizedY
    });
  };

  // Fonction pour capturer les mesures actuelles
  const captureMeasurement = () => {
    const canvas = landmarksCanvasRef.current;
    if (!canvas) return;

    // Récupérer les derniers landmarks reçus
    const lastLandmarks = wsRef.current ? wsRef.current.lastLandmarks : null;
    
    let eyeCenters = null;
    if (lastLandmarks && lastLandmarks.landmarks) {
      const leftEyePoints = lastLandmarks.landmarks.slice(130, 140);
      const rightEyePoints = lastLandmarks.landmarks.slice(360, 370);
      
      if (leftEyePoints.length > 0 && rightEyePoints.length > 0) {
        const leftEyeCenter = {
          x: leftEyePoints.reduce((sum, p) => sum + p.x, 0) / leftEyePoints.length,
          y: leftEyePoints.reduce((sum, p) => sum + p.y, 0) / leftEyePoints.length
        };
        
        const rightEyeCenter = {
          x: rightEyePoints.reduce((sum, p) => sum + p.x, 0) / rightEyePoints.length,
          y: rightEyePoints.reduce((sum, p) => sum + p.y, 0) / rightEyePoints.length
        };
        
        eyeCenters = {
          left: leftEyeCenter,
          right: rightEyeCenter,
          center: {
            x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
            y: (leftEyeCenter.y + rightEyeCenter.y) / 2
          }
        };
      }
    }

    const measurement = {
      timestamp: new Date().toLocaleTimeString(),
      scale: faceScale,
      dimensions: { ...dimensions },
      facePosition: facePosition,
      eyeCenters: eyeCenters,
      normalizedPosition: eyeCenters ? {
        x: (eyeCenters.center.x / dimensions.width) * 2 - 1,
        y: -(eyeCenters.center.y / dimensions.height) * 2 + 1
      } : null,
      landmarksCount: lastLandmarks ? lastLandmarks.landmarks.length : 0,
      debug: {
        modelMatrix: facePosition ? [
          faceScale.widthScale, 0, 0, 0,
          0, faceScale.heightScale, 0, 0,
          0, 0, faceScale.widthScale, 0,
          facePosition.x * 2, facePosition.y * 2, -2, 1
        ] : 'Pas de position'
      }
    };

    setMeasurements(prev => [...prev, measurement]);
    console.log('Mesure détaillée capturée:', measurement);
  };

  // Fonction pour effacer les mesures
  const clearMeasurements = () => {
    setMeasurements([]);
  };

  // Modification de la fonction processVideo pour envoyer les images
  const processVideo = () => {
    if (!videoRef.current || !landmarksCanvasRef.current || !wsRef.current || !isConnected) return;

    const canvas = landmarksCanvasRef.current;
    const ctx = canvas.getContext('2d');

    // Dessiner la vidéo sur le canvas
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Envoyer l'image au serveur
    try {
      const imageData = canvas.toDataURL('image/jpeg', 0.7);
      wsRef.current.send(imageData);
    } catch (err) {
      console.error('Erreur envoi image:', err);
    }
  };

  // Ajout de la boucle d'envoi des images
  useEffect(() => {
    const interval = setInterval(processVideo, 1000 / 30); // 30 FPS
    return () => clearInterval(interval);
  }, [isConnected]);

  // Modification de la boucle de rendu pour utiliser le scale dynamique
  const render = useCallback(() => {
    const gl = glRef.current;
    const model = modelRef.current;
    const program = programRef.current;

    if (!gl || !model || !program) {
      requestAnimationFrame(render);
      return;
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    const sortedBuffers = [...model.buffers].sort((a, b) => {
      const aIsTransparent = a.baseColor && a.baseColor[3] < 1.0;
      const bIsTransparent = b.baseColor && b.baseColor[3] < 1.0;
      return aIsTransparent - bIsTransparent;
    });

    // Utiliser les scales séparés pour la largeur et la hauteur
    // et ajouter la position du visage avec une amplitude plus importante
    const modelMatrix = new Float32Array([
      faceScale.widthScale, 0, 0, 0,
      0, faceScale.heightScale, 0, 0,
      0, 0, faceScale.widthScale, 0,
      facePosition ? facePosition.x * 5 : 0, 
      facePosition ? (facePosition.y * 5) + 0.5 : 0.5, // Ajout d'un offset vertical de 0.5
      -2, 
      1
    ]);

    const uModelMatrix = gl.getUniformLocation(program, 'uModelMatrix');
    gl.uniformMatrix4fv(uModelMatrix, false, modelMatrix);

    // Rendu de chaque partie du modèle
    sortedBuffers.forEach(bufferInfo => {
      // Position
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.positionBuffer);
      const aPosition = gl.getAttribLocation(program, 'aPosition');
      gl.vertexAttribPointer(
        aPosition,
        3,
        gl.FLOAT,
        false,
        bufferInfo.positionBufferView.byteStride || 0,
        bufferInfo.positionBufferView.byteOffset || 0
      );
      gl.enableVertexAttribArray(aPosition);

      // Normale
      if (bufferInfo.normalBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.normalBuffer);
        const aNormal = gl.getAttribLocation(program, 'aNormal');
        gl.vertexAttribPointer(
          aNormal,
          3,
          gl.FLOAT,
          false,
          bufferInfo.normalBufferView.byteStride || 0,
          bufferInfo.normalBufferView.byteOffset || 0
        );
        gl.enableVertexAttribArray(aNormal);
      }

      // Indices
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferInfo.indexBuffer);

      // Couleur
      const uBaseColor = gl.getUniformLocation(program, 'uBaseColor');
      gl.uniform4fv(uBaseColor, bufferInfo.baseColor || [0.8, 0.8, 0.8, 1.0]);

      // Rendu
      gl.drawElements(gl.TRIANGLES, bufferInfo.indexCount, gl.UNSIGNED_SHORT, 0);
    });

    requestAnimationFrame(render);
  }, [faceScale, facePosition]);

  // Démarrer la boucle de rendu
  useEffect(() => {
    render();
  }, [render]);

  // Modification de la gestion des messages WebSocket pour stocker les derniers landmarks
  useEffect(() => {
    if (!wsRef.current) return;

    wsRef.current.onmessage = (event) => {
      const canvas = landmarksCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const data = JSON.parse(event.data);

      if (data.success && data.landmarks) {
        // Stocker les derniers landmarks reçus
        wsRef.current.lastLandmarks = data.landmarks;
        
        drawLandmarks(data.landmarks, ctx);
        
        const scaleData = calculateFaceScale(data.landmarks);
        if (scaleData) {
          setFaceScale(scaleData);
        }

        updateModelPosition(data.landmarks);
      }
    };
  }, [dimensions]);

  return (
    <div className="webgl-video-test-container">
      <h1>Test Lunettes 3D</h1>
      {error && <div className="error-message">{error}</div>}
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={captureMeasurement}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Capturer les mesures actuelles
        </button>
        <button 
          onClick={clearMeasurements}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Effacer les mesures
        </button>
      </div>

      {measurements.length > 0 && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          <h3>Mesures capturées:</h3>
          {measurements.map((m, index) => (
            <div key={index} style={{ marginBottom: '10px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
              <strong>Capture {index + 1} ({m.timestamp})</strong>
              <br />
              Scale: {m.scale.widthScale.toFixed(4)}, {m.scale.heightScale.toFixed(4)}
              <br />
              Dimensions: {m.dimensions.width}x{m.dimensions.height}
              <br />
              {m.eyeCenters && (
                <>
                  Centre œil gauche: ({m.eyeCenters.left.x.toFixed(1)}, {m.eyeCenters.left.y.toFixed(1)})
                  <br />
                  Centre œil droit: ({m.eyeCenters.right.x.toFixed(1)}, {m.eyeCenters.right.y.toFixed(1)})
                  <br />
                  Centre calculé: ({m.eyeCenters.center.x.toFixed(1)}, {m.eyeCenters.center.y.toFixed(1)})
                  <br />
                  Position normalisée: ({m.normalizedPosition.x.toFixed(3)}, {m.normalizedPosition.y.toFixed(3)})
                  <br />
                </>
              )}
              Position actuelle: ({m.facePosition?.x?.toFixed(3) || 'N/A'}, {m.facePosition?.y?.toFixed(3) || 'N/A'})
              <br />
              Nombre de landmarks: {m.landmarksCount}
            </div>
          ))}
        </div>
      )}

      <div className="video-container" style={{ 
        position: 'relative',
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        margin: '0 auto'
      }}>
        {/* Conteneur vidéo */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />

        {/* Canvas pour les landmarks */}
        <canvas
          ref={landmarksCanvasRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />

        {/* Canvas WebGL pour le modèle 3D */}
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 2,
            pointerEvents: 'none'
          }}
        />
      </div>
      <div className="status-indicator">
        Status: {isConnected ? 'Connecté' : 'Déconnecté'}
      </div>
    </div>
  );
};

export default WebGLVideoTest; 