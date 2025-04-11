import React, { useEffect, useRef } from 'react';
import { load } from '@loaders.gl/core';
import { GLTFLoader } from '@loaders.gl/gltf';

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

const GltfTest = () => {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const programRef = useRef(null);
  const modelRef = useRef(null);
  const shadersRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');

    if (!gl) {
      console.error('WebGL non supporté');
      return;
    }
    glRef.current = gl;

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

    // Création du programme
    const createProgram = (vertexShader, fragmentShader) => {
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Erreur de liaison du programme:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
      }
      return program;
    };

    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) {
      return;
    }

    const program = createProgram(vertexShader, fragmentShader);
    if (!program) {
      return;
    }

    // Stockage des références
    shadersRef.current = { vertexShader, fragmentShader };
    programRef.current = program;

    gl.useProgram(program);

    // Configuration WebGL
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(0.2, 0.2, 0.2, 1.0);

    // Uniforms globaux
    const uModelMatrix = gl.getUniformLocation(program, 'uModelMatrix');
    const uViewMatrix = gl.getUniformLocation(program, 'uViewMatrix');
    const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
    const uLightDirection = gl.getUniformLocation(program, 'uLightDirection');

    // Matrices
    const modelMatrix = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, -3, 1  // Position ajustée
    ]);

    const viewMatrix = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);

    // Matrice de projection
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = canvas.width / canvas.height;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = new Float32Array(16);
    const f = 1.0 / Math.tan(fieldOfView / 2);
    
    projectionMatrix[0] = f / aspect;
    projectionMatrix[5] = f;
    projectionMatrix[10] = (zFar + zNear) / (zNear - zFar);
    projectionMatrix[11] = -1;
    projectionMatrix[14] = 2 * zFar * zNear / (zNear - zFar);

    // Application des uniforms globaux
    gl.uniformMatrix4fv(uModelMatrix, false, modelMatrix);
    gl.uniformMatrix4fv(uViewMatrix, false, viewMatrix);
    gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
    gl.uniform3fv(uLightDirection, new Float32Array([1.0, 1.0, 1.0]));

    // Chargement du modèle
    const loadModel = async () => {
      try {
        console.log('Début du chargement du modèle GLTF...');
        const gltf = await load('/models/glasses/source/glasses.gltf', GLTFLoader);
        
        console.log('Structure GLTF:', gltf);
        console.log('Matériaux:', gltf.json.materials);

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
          modelMatrix: modelMatrix,
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

    // Animation
    let rotation = 0;
    const render = () => {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      if (modelRef.current && programRef.current) {
        gl.useProgram(programRef.current);

        // Trier les buffers pour que les objets transparents soient rendus en dernier
        const sortedBuffers = [...modelRef.current.buffers].sort((a, b) => {
          const aIsTransparent = a.baseColor[3] < 1.0;
          const bIsTransparent = b.baseColor[3] < 1.0;
          return aIsTransparent - bIsTransparent;
        });

        // Rotation du modèle
        const modelMatrix = modelRef.current.modelMatrix;
        modelMatrix[0] = Math.cos(rotation);
        modelMatrix[2] = Math.sin(rotation);
        modelMatrix[8] = -Math.sin(rotation);
        modelMatrix[10] = Math.cos(rotation);

        // Mise à jour des matrices
        const uModelMatrix = gl.getUniformLocation(programRef.current, 'uModelMatrix');
        gl.uniformMatrix4fv(uModelMatrix, false, modelMatrix);

        // Rendu de chaque partie du modèle
        sortedBuffers.forEach(bufferInfo => {
          // Configuration des attributs de position
          gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.positionBuffer);
          const aPosition = gl.getAttribLocation(programRef.current, 'aPosition');
          gl.vertexAttribPointer(
            aPosition,
            3,
            gl.FLOAT,
            false,
            bufferInfo.positionBufferView.byteStride || 0,
            bufferInfo.positionBufferView.byteOffset || 0
          );
          gl.enableVertexAttribArray(aPosition);

          // Configuration des attributs de normale
          if (bufferInfo.normalBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.normalBuffer);
            const aNormal = gl.getAttribLocation(programRef.current, 'aNormal');
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

          // Configuration des indices
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferInfo.indexBuffer);

          // Application de la couleur du matériau
          const uBaseColor = gl.getUniformLocation(programRef.current, 'uBaseColor');
          gl.uniform4fv(uBaseColor, bufferInfo.baseColor || [0.9, 0.9, 0.9, 1.0]);

          // Rendu
          gl.drawElements(gl.TRIANGLES, bufferInfo.indexCount, gl.UNSIGNED_SHORT, 0);
        });
      }

      rotation += 0.01;
      requestAnimationFrame(render);
    };

    render();

    // Nettoyage
    return () => {
      if (modelRef.current) {
        modelRef.current.cleanup();
      }
      if (shadersRef.current) {
        gl.deleteShader(shadersRef.current.vertexShader);
        gl.deleteShader(shadersRef.current.fragmentShader);
      }
      if (programRef.current) {
        gl.deleteProgram(programRef.current);
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: '1px solid black' }}
      />
    </div>
  );
};

export default GltfTest; 