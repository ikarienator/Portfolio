#if HAS_EXTENSION(OES_texture_float)
float decode(vec4 vec) {
  return vec.x;
}

vec4 encode(float number) {
  return vec4(number);
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
#else
float decode(vec4 fbytes) {
    ivec4 bytes = ivec4(fbytes * 255.0 + 0.5);
    float f = float(bytes[0] + bytes[1] * 256) +
              float(bytes[2] - bytes[2] / 128 * 128 + 128) * 256.0 * 256.0;
    int exp = 150 - (bytes[3] - bytes[3] / 128 * 128) * 2 - (bytes[2] / 128);
    f /= exp2(float(exp));
    if (bytes[3] / 128 == 1)
        return -f;
    else
        return f;
}

vec4 encode(float f) {
    bool pos = f > 0.0;
    if (!pos)
        f = -f;
    int expo = int(floor(log2(f)));
    f *= pow(2.0, 23.0 - float(expo));
    f -= 8388608.0;
    int b = int(floor(f + 0.5));
    expo += 127;
    int posbit = pos ? 0 : 128;
    return vec4(b - b / 256 * 256, b / 256 - b / 256 / 256 * 256,
                b / 256 / 256 + (expo - expo / 2 * 2) * 128,
                expo / 2 + posbit) / 255.0;
}

float texture2DBilinearDecoded(sampler2D tex, vec2 coord) {
  coord *= RESOLUTIONX;
  vec2 fxy = fract(coord),
    ixy = floor(coord) / RESOLUTIONX;
  float px = 1. / RESOLUTIONX;
  return mix( 
    mix(
      decode(texture2D(tex, ixy)),
      decode(texture2D(tex, ixy + vec2(px, 0))),
      fxy.x
      ),
    mix(
      decode(texture2D(tex, ixy + vec2(0, px))),
      decode(texture2D(tex, ixy + vec2(px, px))),
      fxy.x
      ),
    fxy.y);
}
#endif