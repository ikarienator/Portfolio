#ifdef GL_ES
precision highp float;
#endif

#include "index.include.glsl"
#include "packing.include.glsl"

attribute vec3 aPosition;
attribute vec3 normal;
attribute vec2 texCoord1;

varying vec4 vPosition;

uniform sampler2D texture0, texture1, texture2, texture3, texture4, texture5;
uniform vec3 cameraPosition;
uniform mat4 objectMatrix, viewMatrix, worldMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewProjectionMatrix;

void main(void) {
  vTexCoord = texCoord1;
  vPosition = vec4(aPosition.xyz - normal * b2f(getd(texture0, 0 ,0)), 1);
  gl_Position = projectionMatrix * worldMatrix * vPosition;
}
