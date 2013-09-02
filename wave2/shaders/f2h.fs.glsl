#ifdef GL_ES
precision highp float;
#endif

#include "index.include.glsl"
#include "packing.include.glsl"

#define sqrt2 1.4142135623730951
#define PI   3.1415926535897932
#define PI_2 1.5707963267948966
uniform bool isElevation;

#define sq 0.36
uniform sampler2D texture0, texture1;
uniform float elevation;
uniform vec2 cursor;
uniform float dt, time;

void main(void) {
  float h = b2f(getd(texture0, 0, 0)) + 0.5;
  float v = b2f(getd(texture1, 0, 0)) + 0.5;
  gl_FragColor = vec4(h, v, 0.5, 1);
  return;
}