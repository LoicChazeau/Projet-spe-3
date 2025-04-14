import React, { useRef, useEffect, useState } from 'react';
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

  // Ajout d'un canvas 2D pour les landmarks
  const landmarksCanvasRef = useRef(null);

  // Shaders
  const vertexShaderSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    
    uniform mat4 uModelMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjectionMatrix;
    
    varying vec3 vNormal;
    
    void main() {
      vNormal = mat3(uModelMatrix) * aNormal;
      gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;
    
    varying vec3 vNormal;
    uniform vec3 uLightDirection;
    uniform vec4 uBaseColor;
    
    void main() {
      vec3 normal = normalize(vNormal);
      float light = dot(normal, normalize(uLightDirection));
      vec3 color = uBaseColor.rgb * (0.5 + 0.5 * light);
      gl_FragColor = vec4(color, uBaseColor.a);
    }
  `;

  // Initialisation WebGL
  useEffect(() => {
    const initWebGL = () => {
      const canvas = canvasRef.current;
      const gl = canvas.getContext('webgl');
      if (!gl) {
        setError('WebGL non supporté');
        return;
      }
      glRef.current = gl;

      // Création des shaders
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertexShaderSource);
      gl.compileShader(vertexShader);

      // Vérification de la compilation du vertex shader
      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('Erreur vertex shader:', gl.getShaderInfoLog(vertexShader));
        return;
      }

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, fragmentShaderSource);
      gl.compileShader(fragmentShader);

      // Vérification de la compilation du fragment shader
      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('Erreur fragment shader:', gl.getShaderInfoLog(fragmentShader));
        return;
      }

      // Création du programme
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      // Vérification du programme
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Erreur programme WebGL:', gl.getProgramInfoLog(program));
        return;
      }

      gl.useProgram(program);
      programRef.current = program;
      console.log('[3D] Programme WebGL initialisé avec succès');

      // Configuration WebGL
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    };

    initWebGL();
  }, []);

  // Chargement du modèle GLTF
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('[3D] Début du chargement du modèle GLTF...');
        const gltf = await load('/models/glasses/source/glasses.gltf', GLTFLoader);
        console.log('[3D] Structure du modèle:', {
          meshes: gltf.json.meshes?.length || 0,
          buffers: gltf.buffers?.length || 0
        });

        const meshes = gltf.json.meshes;
        if (!meshes || meshes.length === 0) {
          throw new Error('Pas de mesh trouvé dans le fichier GLTF');
        }

        const gl = glRef.current;
        const program = programRef.current;

        if (!gl || !program) {
          throw new Error('Contexte WebGL non initialisé');
        }

        // Création des buffers pour le premier mesh
        const mesh = meshes[0];
        const primitive = mesh.primitives[0];
        console.log('[3D] Primitive:', {
          attributes: Object.keys(primitive.attributes),
          hasIndices: primitive.indices !== undefined
        });

        // Récupération des données de position
        const positionAccessor = gltf.json.accessors[primitive.attributes.POSITION];
        const positionBufferView = gltf.json.bufferViews[positionAccessor.bufferView];
        const positionBuffer = gltf.buffers[positionBufferView.buffer];
        const positions = new Float32Array(positionBuffer.arrayBuffer);
        console.log('[3D] Positions buffer créé:', positions.length);

        const glPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, glPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        // Récupération des normales
        let glNormalBuffer = null;
        if (primitive.attributes.NORMAL !== undefined) {
          const normalAccessor = gltf.json.accessors[primitive.attributes.NORMAL];
          const normalBufferView = gltf.json.bufferViews[normalAccessor.bufferView];
          const normalBuffer = gltf.buffers[normalBufferView.buffer];
          const normals = new Float32Array(normalBuffer.arrayBuffer);
          console.log('[3D] Normales buffer créé:', normals.length);

          glNormalBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, glNormalBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
        }

        // Récupération des indices
        const indexAccessor = gltf.json.accessors[primitive.indices];
        const indexBufferView = gltf.json.bufferViews[indexAccessor.bufferView];
        const indexBuffer = gltf.buffers[indexBufferView.buffer];
        const indices = new Uint16Array(indexBuffer.arrayBuffer);
        console.log('[3D] Indices buffer créé:', indices.length);

        const glIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        modelRef.current = {
          positionBuffer: glPositionBuffer,
          normalBuffer: glNormalBuffer,
          indexBuffer: glIndexBuffer,
          indexCount: indices.length,
          program: program
        };

        console.log('[3D] Modèle chargé avec succès');
      } catch (error) {
        console.error('[3D] Erreur lors du chargement du modèle:', error);
        setError('Erreur lors du chargement du modèle 3D');
      }
    };

    loadModel();
  }, []);

  // Initialisation WebSocket et Webcam
  useEffect(() => {
    // Initialisation WebSocket
    wsRef.current = new WebSocket('ws://localhost:8001/api/v1/face/ws');

    wsRef.current.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
      setError(null);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setError('Erreur de connexion au serveur');
    };

    // Initialisation Webcam
    navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    })
    .then(stream => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setDimensions({
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight
          });
        };
      }
    })
    .catch(err => {
      console.error('Erreur webcam:', err);
      setError('Impossible d\'accéder à la webcam');
    });

    // Nettoyage
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const drawLandmarks = (landmarks, ctx) => {
    if (!landmarks || !ctx) return;
    
    // Effacer le canvas précédent
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    // Dessiner l'image de la webcam
    if (videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, dimensions.width, dimensions.height);
    }

    // Dessiner les landmarks
    ctx.fillStyle = '#00FF00';
    landmarks.landmarks.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Afficher les informations de debug
    //console.log('Landmarks reçus:', landmarks);
  };

  // Modification de la gestion des messages WebSocket
  useEffect(() => {
    if (!wsRef.current) return;

    wsRef.current.onmessage = (event) => {
      const canvas = landmarksCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const data = JSON.parse(event.data);

      if (data.success) {
        //console.log('Message reçu du serveur:', data);
        
        if (data.landmarks) {
          // Dessiner les landmarks
          drawLandmarks(data.landmarks, ctx);
          
          // Mettre à jour la position du modèle 3D
          setFacePosition(data.landmarks);
          updateModelPosition(data.landmarks);
        }
      }
    };
  }, [dimensions]);

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

  // Fonction de mise à jour de la position du modèle
  const updateModelPosition = (landmarks) => {
    if (!modelRef.current) return;
    // TODO: Convertir les landmarks 2D en position 3D
    // et mettre à jour la matrice de transformation du modèle
  };

  // Modification de la boucle de rendu
  useEffect(() => {
    const render = () => {
      if (!glRef.current || !modelRef.current) {
        console.log('[3D] En attente du contexte WebGL ou du modèle...');
        requestAnimationFrame(render);
        return;
      }

      const gl = glRef.current;
      const model = modelRef.current;

      try {
        // Clear et configuration
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(model.program);

        // Configuration des attributs
        const aPosition = gl.getAttribLocation(model.program, 'aPosition');
        gl.bindBuffer(gl.ARRAY_BUFFER, model.positionBuffer);
        gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        if (model.normalBuffer) {
          const aNormal = gl.getAttribLocation(model.program, 'aNormal');
          gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
          gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(aNormal);
        }

        // Matrices de transformation
        const modelMatrix = new Float32Array([
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, -5, 1
        ]);

        const viewMatrix = new Float32Array([
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1
        ]);

        // Matrice de projection
        const fieldOfView = 45 * Math.PI / 180;
        const aspect = gl.canvas.width / gl.canvas.height;
        const zNear = 0.1;
        const zFar = 100.0;
        const projectionMatrix = new Float32Array(16);
        const f = 1.0 / Math.tan(fieldOfView / 2);
        
        projectionMatrix[0] = f / aspect;
        projectionMatrix[5] = f;
        projectionMatrix[10] = (zFar + zNear) / (zNear - zFar);
        projectionMatrix[11] = -1;
        projectionMatrix[14] = 2 * zFar * zNear / (zNear - zFar);

        // Envoi des matrices aux shaders
        const uModelMatrix = gl.getUniformLocation(model.program, 'uModelMatrix');
        const uViewMatrix = gl.getUniformLocation(model.program, 'uViewMatrix');
        const uProjectionMatrix = gl.getUniformLocation(model.program, 'uProjectionMatrix');
        const uLightDirection = gl.getUniformLocation(model.program, 'uLightDirection');
        const uBaseColor = gl.getUniformLocation(model.program, 'uBaseColor');

        gl.uniformMatrix4fv(uModelMatrix, false, modelMatrix);
        gl.uniformMatrix4fv(uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
        gl.uniform3fv(uLightDirection, new Float32Array([1, 1, 1]));
        gl.uniform4fv(uBaseColor, new Float32Array([0.8, 0.8, 0.8, 1.0]));

        // Rendu du modèle
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
        gl.drawElements(gl.TRIANGLES, model.indexCount, gl.UNSIGNED_SHORT, 0);

      } catch (error) {
        console.error('[3D] Erreur lors du rendu:', error);
      }

      requestAnimationFrame(render);
    };

    render();
  }, []);

  return (
    <div className="webgl-video-test-container">
      <h1>Test Lunettes 3D</h1>
      {error && <div className="error-message">{error}</div>}
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          width={dimensions.width}
          height={dimensions.height}
        />
        <canvas
          ref={landmarksCanvasRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1
          }}
        />
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2
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