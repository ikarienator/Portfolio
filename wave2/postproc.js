/**
 * @license
 * Copyright (C) 2013 Bei Zhang <ikarienator@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

var MAPPING_VERTEX_SHADER = "attribute vec3 aPosition;\n" +
    "varying vec2 vTexCoord;\n" +
    "void main() {\n" +
    "  gl_Position = vec4((aPosition - 0.5) * 2.0, 1.0);\n" +
    "  vTexCoord = aPosition.xy;\n" +
    "}";

var MAPPING_FRAGMENT_SHADER = "#ifdef GL_ES\n" +
    "precision highp float;\n" +
    "#endif\n" +
    "uniform sampler2D tex0;\n" +
    "varying vec2 vTexCoord;\n" +
    "void main() {\n" +
    "  gl_FragColor = texture2D(tex0, vTexCoord);\n" +
    "}";

var GL = WebGLRenderingContext;

var UNIFORM_MAP = {};
UNIFORM_MAP[GL.FLOAT] = '1f';
UNIFORM_MAP[GL.FLOAT_VEC2] = '2fv';
UNIFORM_MAP[GL.FLOAT_VEC3] = '3fv';
UNIFORM_MAP[GL.FLOAT_VEC4] = '4fv';
UNIFORM_MAP[GL.INT] = '1i';
UNIFORM_MAP[GL.INT_VEC2] = '2iv';
UNIFORM_MAP[GL.INT_VEC3] = '3iv';
UNIFORM_MAP[GL.INT_VEC2] = '4iv';
UNIFORM_MAP[GL.BOOL] = '1i';
UNIFORM_MAP[GL.BOOL_VEC2] = '2iv';
UNIFORM_MAP[GL.BOOL_VEC3] = '3iv';
UNIFORM_MAP[GL.BOOL_VEC4] = '4iv';
UNIFORM_MAP[GL.FLOAT_MAT2] = 'Matrix2fv';
UNIFORM_MAP[GL.FLOAT_MAT3] = 'Matrix3fv';
UNIFORM_MAP[GL.FLOAT_MAT4] = 'Matrix4fv';
UNIFORM_MAP[GL.SAMPLER_2D] = '1i';
UNIFORM_MAP[GL.SAMPLER_CUBE] = '1i';

function PostProcessor(canvas) {
  canvas = canvas || document.createElement('canvas');
  this.canvas = canvas;
  /**
   *
   * @type {WebGLRenderingContext}
   */
  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  this.gl = gl;

  this.vbo = gl.createBuffer();
  gl.bindBuffer(GL.ARRAY_BUFFER, this.vbo);
  gl.bufferData(GL.ARRAY_BUFFER, new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0]), GL.STATIC_DRAW);
  this.ibo = gl.createBuffer();
  gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.ibo);
  gl.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 2, 1, 3]), GL.STATIC_DRAW);
  this.frameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(GL.FRAMEBUFFER, this.frameBuffer);
  this.copyProgram = this.createProgram(MAPPING_VERTEX_SHADER, MAPPING_FRAGMENT_SHADER);
}

PostProcessor.prototype.installUniform = function (program, uniformName, uniformType) {
  var gl = this.gl;
  var uniformLocation = gl.getUniformLocation(program, uniformName);
  if (uniformLocation) {
    program.uniforms.__defineGetter__(uniformName, function () {
      return gl["uniform" + uniformType](uniformLocation);
    });
    program.uniforms.__defineSetter__(uniformName, function (value) {
      gl["uniform" + uniformType](uniformLocation, value);
    });
  }
};

PostProcessor.prototype.createPlainProgram = function (fragmentShader) {
  return this.createProgram(MAPPING_VERTEX_SHADER, fragmentShader);
};

PostProcessor.prototype.createProgram = function (vertexShaderText, fragmentShaderText) {
  var gl = this.gl;
  var success = false;
  try {
    var vertexShader = gl.createShader(GL.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderText);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, GL.COMPILE_STATUS)) {
      throw "Failed to create vertex shader:\n" + gl.getShaderInfoLog(vertexShader);
    }

    var fragmentShader = gl.createShader(GL.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderText);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, GL.COMPILE_STATUS)) {
      throw "Failed to create fragment shader:\n" + gl.getShaderInfoLog(fragmentShader);
    }

    var program = gl.createProgram();
    // attach our two shaders to the program
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, GL.LINK_STATUS)) {
      throw "Failed to link program:\n" + gl.getProgramInfoLog(program);
    }

    gl.enableVertexAttribArray(gl.getAttribLocation(program, "aPosition"));
    gl.vertexAttribPointer(gl.getAttribLocation(program, "aPosition"), 3, GL.FLOAT, false, 12, 0); // position

    gl.useProgram(program);

    program.uniforms = {};

    var numUniforms = gl.getProgramParameter(program, GL.ACTIVE_UNIFORMS);
    for (var i = 0; i < numUniforms; i++) {
      var uniformInfo = gl.getActiveUniform(program, i);
      if (uniformInfo.size == 1) {
        this.installUniform(program, uniformInfo.name, UNIFORM_MAP[uniformInfo.type]);
      }
    }
    success = true;
    return program;
  } finally {
    if (!success) {
      if (program) {
        gl.deleteProgram(program);
        program = undefined;
      }
      if (vertexShader) {
        gl.deleteShader(vertexShader);
      }
      if (fragmentShader) {
        gl.deleteShader(fragmentShader);
      }
    }
  }
};

PostProcessor.prototype.createInput = function (array, width, height) {
  var gl = this.gl;
  var texture = gl.createTexture();
  gl.bindTexture(GL.TEXTURE_2D, texture);
  gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
  gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
  gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
  gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
  texture.width = width;
  texture.height = height;
  gl.bindTexture(GL.TEXTURE_2D, texture);
  gl.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, width, height, 0, GL.RGBA, GL.UNSIGNED_BYTE,
      array ? new Uint8Array(array.buffer) : null);
  return texture;
};

PostProcessor.prototype.callProgram = function (program, inputs, output, uniforms) {
  var gl = this.gl;
  gl.useProgram(program);
  program.uniforms.width = output.width;
  program.uniforms.height = output.height;

  // Output
  gl.viewport(0, 0, output.width, output.height);
  gl.bindFramebuffer(GL.FRAMEBUFFER, this.frameBuffer);
  gl.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, output, 0);

  // Input
  for (var i = 0; i < inputs.length; i++) {
    program.uniforms['texture' + i] = i;
    gl.activeTexture(GL.TEXTURE0 + i);
    gl.bindTexture(GL.TEXTURE_2D, inputs[i]);
  }

  if (uniforms) {
    for (var name in uniforms) {
      if (uniforms.hasOwnProperty(name)) {
        program.uniforms[name] = uniforms[name];
      }
    }
  }
  gl.bindBuffer(GL.ARRAY_BUFFER, this.vbo);
  gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.ibo);
  gl.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, 0);
};


PostProcessor.prototype.renderTexture = function (texture) {
  var gl = this.gl;
  gl.viewport(0, 0, texture.width, texture.height);

  // Output
  gl.bindFramebuffer(GL.FRAMEBUFFER, null);
  // Input
  gl.activeTexture(GL.TEXTURE0);
  gl.bindTexture(GL.TEXTURE_2D, texture);

  gl.useProgram(this.copyProgram);
  this.copyProgram.uniforms.width = texture.width;
  this.copyProgram.uniforms.height = texture.height;

  gl.bindBuffer(GL.ARRAY_BUFFER, this.vbo);
  gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.ibo);
  gl.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, 0);
};
