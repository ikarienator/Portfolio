attribute vec3 aPosition;
varying vec4 vPosition;
uniform mat4 worldMatrix;
uniform mat4 projectionMatrix;

void main(void) {
  vPosition = vec4(aPosition, 1);
  gl_Position = projectionMatrix * worldMatrix * vPosition;
}
