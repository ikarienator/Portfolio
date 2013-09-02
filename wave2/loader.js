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

(function (global) {
  var scripts = document.querySelectorAll('script');
  var script_base_url = scripts[scripts.length - 1].src;
  scripts = null;
  var include_re = /^#include\s*"([\w\.]+?)"\s*$/m;
  var rel_re = /(\/[^\/]+\/\.\.)|([^\/]+\/\.\.\/?)/g;
  var root_re = /^[\w\-]*:\/\/[\w\-\.]+/;
  var loadingCache = {};

  function resolveShader(code, file, callback) {
    if (!include_re.test(code)) {
      callback(code);
      return;
    }
    loadShaderImpl(include_re.exec(code)[1], file, function (shader) {
      code = code.replace(include_re, shader);
      resolveShader(code, file, callback);
    });
  }

  function loadShaderImpl(file, base_url, callback) {
    if (loadingCache[file]) {
      callback(loadingCache[file]);
      return;
    }

    var nf = file.replace(rel_re, '');
    while (nf != file) {
      file = nf;
      nf = file.replace(rel_re, '');
    }
    if (root_re.exec(file)) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", file, true);
      xhr.onload = function () {
        var code = xhr.responseText;
        resolveShader(code, file, function (resolved_code) {
          loadingCache[file] = resolved_code;
          callback(resolved_code);
        });
      };
      xhr.send(null);
      return;
    }

    if (base_url.charAt(base_url.length - 1) == '/') {
      loadShaderImpl(base_url + file, base_url, callback);
    } else {
      loadShaderImpl(base_url.substring(0, base_url.lastIndexOf('/') + 1) + file, base_url, callback);
    }
  }

  function loadShader(file, callback) {
    loadShaderImpl(file, script_base_url, callback);
  }

  function loadShaders(files, callback) {
    var results = [], finished = 0;

    files.forEach(function (file, i) {
      loadShader(file, function (code) {
        results[i] = code;
        finished++;
        if (finished == files.length) {
          callback(results);
        }
      });
    });
  }

  function loadImage(file, callback) {
    var image = new Image();
    image.onload = function () {
      callback(image);
    };
    image.src = file;
  }

  function loadImages(files, callback) {
    var results = [], finished = 0;

    files.forEach(function (file, i) {
      loadImage(file, function (result) {
        results[i] = result;
        finished++;
        if (finished == files.length) {
          callback(results);
        }
      });
    });
  }

  global.loadShader = loadShader;
  global.loadShaders = loadShaders;
  global.loadImage = loadImage;
  global.loadImages = loadImages;
})(this);
