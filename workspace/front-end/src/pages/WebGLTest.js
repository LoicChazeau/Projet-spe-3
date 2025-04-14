import React, { useEffect, useRef } from 'react';

const vertexShaderSource = `
  attribute vec4 aPosition;
  attribute vec4 aColor;
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  varying vec4 vColor;
  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
    vColor = aColor;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  varying vec4 vColor;
  void main() {
    gl_FragColor = vColor;
  }
`;

const WebGLTest = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');

    if (!gl) {
      console.error('WebGL non supporté');
      return;
    }

    // Création des shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    // Création du programme
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Création du cube
    const vertices = new Float32Array([
      // Face avant
      -1.0, -1.0,  1.0,
       1.0, -1.0,  1.0,
       1.0,  1.0,  1.0,
      -1.0,  1.0,  1.0,
      // Face arrière
      -1.0, -1.0, -1.0,
      -1.0,  1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0, -1.0, -1.0,
      // Face supérieure
      -1.0,  1.0, -1.0,
      -1.0,  1.0,  1.0,
       1.0,  1.0,  1.0,
       1.0,  1.0, -1.0,
      // Face inférieure
      -1.0, -1.0, -1.0,
       1.0, -1.0, -1.0,
       1.0, -1.0,  1.0,
      -1.0, -1.0,  1.0,
      // Face droite
       1.0, -1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0,  1.0,  1.0,
       1.0, -1.0,  1.0,
      // Face gauche
      -1.0, -1.0, -1.0,
      -1.0, -1.0,  1.0,
      -1.0,  1.0,  1.0,
      -1.0,  1.0, -1.0,
    ]);

    const colors = new Float32Array([
      // Face avant : rouge
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      1.0, 0.0, 0.0, 1.0,
      // Face arrière : vert
      0.0, 1.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 1.0,
      // Face supérieure : bleu
      0.0, 0.0, 1.0, 1.0,
      0.0, 0.0, 1.0, 1.0,
      0.0, 0.0, 1.0, 1.0,
      0.0, 0.0, 1.0, 1.0,
      // Face inférieure : jaune
      1.0, 1.0, 0.0, 1.0,
      1.0, 1.0, 0.0, 1.0,
      1.0, 1.0, 0.0, 1.0,
      1.0, 1.0, 0.0, 1.0,
      // Face droite : violet
      1.0, 0.0, 1.0, 1.0,
      1.0, 0.0, 1.0, 1.0,
      1.0, 0.0, 1.0, 1.0,
      1.0, 0.0, 1.0, 1.0,
      // Face gauche : cyan
      0.0, 1.0, 1.0, 1.0,
      0.0, 1.0, 1.0, 1.0,
      0.0, 1.0, 1.0, 1.0,
      0.0, 1.0, 1.0, 1.0,
    ]);

    const indices = new Uint16Array([
      0,  1,  2,    0,  2,  3,    // Face avant
      4,  5,  6,    4,  6,  7,    // Face arrière
      8,  9,  10,   8,  10, 11,   // Face supérieure
      12, 13, 14,   12, 14, 15,   // Face inférieure
      16, 17, 18,   16, 18, 19,   // Face droite
      20, 21, 22,   20, 22, 23,   // Face gauche
    ]);

    // Buffer des positions
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    // Buffer des couleurs
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    const aColor = gl.getAttribLocation(program, 'aColor');
    gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aColor);

    // Buffer des indices
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // Matrices
    const modelViewMatrix = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, -6, 1
    ]);

    // Matrice de projection avec une bonne perspective
    const fieldOfView = 45 * Math.PI / 180;   // en radians
    const aspect = canvas.width / canvas.height;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = new Float32Array(16);
    const f = 1.0 / Math.tan(fieldOfView / 2);
    
    projectionMatrix[0] = f / aspect;
    projectionMatrix[1] = 0;
    projectionMatrix[2] = 0;
    projectionMatrix[3] = 0;
    
    projectionMatrix[4] = 0;
    projectionMatrix[5] = f;
    projectionMatrix[6] = 0;
    projectionMatrix[7] = 0;
    
    projectionMatrix[8] = 0;
    projectionMatrix[9] = 0;
    projectionMatrix[10] = (zFar + zNear) / (zNear - zFar);
    projectionMatrix[11] = -1;
    
    projectionMatrix[12] = 0;
    projectionMatrix[13] = 0;
    projectionMatrix[14] = 2 * zFar * zNear / (zNear - zFar);
    projectionMatrix[15] = 0;

    const uModelViewMatrix = gl.getUniformLocation(program, 'uModelViewMatrix');
    const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');

    // Configuration du viewport
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
    gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);

    // Configuration du rendu
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);  // Active le culling des faces
    gl.clearColor(0.2, 0.2, 0.2, 1.0);

    // Animation
    let rotation = 0;
    const render = () => {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Rotation du cube
      modelViewMatrix[0] = Math.cos(rotation);
      modelViewMatrix[2] = Math.sin(rotation);
      modelViewMatrix[8] = -Math.sin(rotation);
      modelViewMatrix[10] = Math.cos(rotation);
      gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);

      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
      rotation += 0.01;
      requestAnimationFrame(render);
    };

    render();
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

export default WebGLTest; 