#ifdef GL_ES
precision highp float;
#endif

#include "index.include.glsl"
#include "packing.include.glsl"

#line 8

#define sqrt2 1.4142135623730951
#define PI   3.1415926535897932
#define PI_2 1.5707963267948966
uniform bool isElevation;

#define sq 0.36
uniform sampler2D texture0, texture1;
uniform float dt;

void main(void) {
  float k = 15.0;
  float fade = 1.5;
  float f = 0., a;

  vec2 aPosition = vTexCoord;
  float h = b2f(getd(texture0, 0, 0));
  float v0 = b2f(getd(texture1, 0, 0)) * pow(fade, -dt);

  float z = 0.0;
  for (int i = -1; i <= 1; i += 1) {
    for (int j = -1; j <= 1; j += 1) {
      z += b2f(getd(texture0, i, j));
    }
  }

  float dh = z / 9.0 - h - h / 6.0;
  
  f += h * .1;
  a = dh * k;
  h += v0 * dt;
  h *= pow(fade, -dt);
  if (isElevation) {
    gl_FragColor = f2b(h);
  } else {
    gl_FragColor = f2b(v0 + a * dt);
  }
}