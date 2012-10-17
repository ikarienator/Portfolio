float decode(vec4 vec) {
  return clamp(vec.x, -2., 2.);
}

vec4 encode(float number) {
  return vec4(clamp(number, -2., 2.));
}

float texture2DBilinearDecoded(sampler2D tex, vec2 coord) {
  coord *= RESOLUTIONX;
  vec2 fxy = fract(coord),
    ixy = floor(coord) / RESOLUTIONX;
  float px = 1. / RESOLUTIONX;
  return mix( 
    mix(
      texture2D(tex, ixy).x,
      texture2D(tex, ixy + vec2(px, 0)).x,
      fxy.x
      ),
    mix(
      texture2D(tex, ixy + vec2(0, px)).x,
      texture2D(tex, ixy + vec2(px, px)).x,
      fxy.x
      ),
    fxy.y);
}