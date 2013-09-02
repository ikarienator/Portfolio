#ifdef GL_ES
precision highp float;
#endif

#define PI 3.14159265359
uniform sampler2D texture0, texture1, texture2, texture3, texture4;
// uniform samplerCube samplerCube1;
uniform vec3 cameraPosition;
varying vec4 vPosition;

#include "env.glsl"

void main(void) {
  vec3 direction = vPosition.xyz - cameraPosition; 
  gl_FragColor = envSampling(direction, cameraPosition, texture0, texture1, texture2, texture3, texture4);
}