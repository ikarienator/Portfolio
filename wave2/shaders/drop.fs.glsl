#ifdef GL_ES
precision highp float;
#endif

#include "index.include.glsl"
#include "packing.include.glsl"

uniform sampler2D texture0;
uniform float elevation;
uniform vec2 cursor;


void main(void) {
  float dist = distance(vTexCoord, cursor);
  float el = b2f(getd(texture0, 0, 0));
  el += elevation * exp(-dist * dist * 3000.0);
  gl_FragColor = f2b(el);
}