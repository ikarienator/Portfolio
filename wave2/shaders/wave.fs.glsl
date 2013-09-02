#ifdef GL_ES
precision highp float;
#endif

#define LIGHT_MAX 40

#include "index.include.glsl"
#include "packing.include.glsl"
#include "env.glsl"
#include "raytrace.glsl"

varying vec4 vPosition;

uniform sampler2D texture0, texture1, texture2, texture3, texture4, texture5;
uniform vec3 cameraPosition;
uniform mat4 objectMatrix, viewMatrix, worldMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewProjectionMatrix;

uniform float n1, n2;
uniform float renderType;
uniform vec3 plainU;
uniform vec3 plainV;
uniform vec3 plainC;

vec4 sample(vec3 direction) {
  vec3 from = vPosition.xyz;
  vec3 hit = plainRT(direction, from, plainU, plainV, plainC);
  if (abs(hit.x) <= 1.0 && abs(hit.y) <= 1.0 && hit.z >= 0.0) {
    vec2 samp = vec2((hit.x + 1.0) * 0.5, (hit.y + 1.0) * 0.5); 
    return texture2D(texture5, vec2(samp.x * 4., samp.y * 8.));
  }
  return envSampling(direction, vPosition.xyz, texture1, texture2, texture3, texture4, texture5);
}

vec4 shot(vec3 aPosition) {
  float n = n1 / n2;
  float dx = (b2f(getd(texture0, 1, 0)) - b2f(getd(texture0, -1, 0))) * float(width) * 0.5;
  float dy = (b2f(getd(texture0, 0, 1)) - b2f(getd(texture0, 0, -1))) * float(height) * 0.5;
  vec3 normal = normalize(vec3(vec2(dx, dy), 1));
  
  vec3 eyeDirection = normalize(aPosition.xyz - cameraPosition);
  vec3 reflectVec = reflect(eyeDirection, normal);
  vec4 reflectColor = sample(reflectVec);
  vec3 refractVec;
  vec4 refractColor = vec4(0);
  vec4 reflectFilter = vec4(1);
  vec4 refractFilter = vec4(0.8, 0.9, 1., 1);
  float reflectionFactor = 0.;
  
  // http://en.wikipedia.org/wiki/Fresnel_equations
  if (dot(eyeDirection, normal) > 0.) {
    normal = -normal;
    n = 1. / n;
    reflectFilter = vec4(0.6, 0.8, 1., 1);
    refractFilter = vec4(0.8, 0.9, 1., 1);
  }
  
  refractVec = refract(eyeDirection, normal, n);
  refractColor = sample(refractVec);
    
  float cosSi = dot(-eyeDirection, normal);
  float refl = clamp(sqrt(1. - cosSi * cosSi) * n, -1., 1.);
  float cosSt = sqrt(1. - refl * refl);
  float sist = cosSi / cosSt;
  float Rs = 1. - 2. / (n * sist + 1.);
  float Rp = 1. - 2. / (n / sist + 1.);
  Rs *= Rs;
  Rp *= Rp;
  reflectionFactor = (Rs + Rp) * 0.5;
  return mix(reflectColor * reflectFilter, refractColor * refractFilter, 1. - reflectionFactor);
}

void main(void) {
  float px = .005;
  gl_FragColor = shot(vPosition.xyz);
}
