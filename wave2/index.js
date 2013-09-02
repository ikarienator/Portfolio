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
 * ARE DISCLAIMED. IN NO EVENT SHALL BEI ZHANG BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';
(function () {
  var canvas = document.getElementById('wave');
  var WIDTH = Math.pow(2, Math.ceil(Math.log(parseInt(canvas.style.width) * devicePixelRatio) * Math.LOG2E));
  var HEIGHT = Math.pow(2, Math.ceil(Math.log(parseInt(canvas.style.height) * devicePixelRatio) * Math.LOG2E));

  canvas.width = parseInt(canvas.style.width) * devicePixelRatio;
  canvas.height = parseInt(canvas.style.height) * devicePixelRatio;


  var RESOLUTION = 128;
  var postProc = new PostProcessor(canvas);

  var gl = postProc.gl;
loadShaders([
  'shaders/calc.fs.glsl',
  'shaders/drop.fs.glsl',
  'shaders/shore.vs.glsl',
  'shaders/shore.fs.glsl',
  'shaders/back.vs.glsl',
  'shaders/back.fs.glsl',
  'shaders/wave.vs.glsl',
  'shaders/wave.fs.glsl',
  'shaders/f2h.fs.glsl'
], function (shaders) {
  var canvas = document.querySelector('#wave');
  var calcProgram = postProc.createPlainProgram(shaders[0]);
  var dropProgram = postProc.createPlainProgram(shaders[1]);
  var shoreProgram = postProc.createProgram(shaders[2], shaders[3]);
  var backProgram = postProc.createProgram(shaders[4], shaders[5]);
  var waveProgram = postProc.createProgram(shaders[6], shaders[7]);
  var f2hProgram = postProc.createPlainProgram(shaders[8]);

  var height0 = postProc.createInput(null, RESOLUTION, RESOLUTION);
  var velocity0 = postProc.createInput(null, RESOLUTION, RESOLUTION);
  var height1 = postProc.createInput(null, RESOLUTION, RESOLUTION);
  var velocity1 = postProc.createInput(null, RESOLUTION, RESOLUTION);

  var output = postProc.createInput(null, RESOLUTION, RESOLUTION);
  var lastTime = performance.now();
  webkitRequestAnimationFrame(function animate() {
    postProc.callProgram(f2hProgram, [height1, velocity1], output);
    postProc.renderTexture(output);
    webkitRequestAnimationFrame(animate);
  });

  setInterval(function update() {
    var dt = (performance.now() - lastTime) / 100;
    lastTime = performance.now();
    var N = 10;
    for (var i = 0; i < N; i++) {
      postProc.callProgram(calcProgram, [height0, velocity0], height1, { dt: dt / N, isElevation: true });
      postProc.callProgram(calcProgram, [height0, velocity0], velocity1, { dt: dt / N, isElevation: false });
      var temp = height0;
      height0 = height1;
      height1 = temp;
      temp = velocity0;
      velocity0 = velocity1;
      velocity1 = temp;
    }
  }, 25);

  setInterval(function () {
    postProc.callProgram(dropProgram, [height0], height1, {
      cursor: [Math.random(), Math.random()],
      elevation: 1
    });
    var temp = height0;
    height0 = height1;
    height1 = temp;
  }, 100);
});

})();