#line 20001
uniform int width, height;

varying vec2 vTexCoord;

ivec2 getIndex() {
  return ivec2(int(vTexCoord.x * float(width)),
               int(vTexCoord.y * float(height)));
}

vec4 get(sampler2D tex, int x, int y) {
  if (x < 0 || x >= width || y < 0 || y >= height)
    return vec4(0);
  return texture2D(tex, vec2(float(x) / float(width),
                   float(y) / float(height)));
}

vec4 getd(sampler2D tex, int dx, int dy) {
  ivec2 idx = getIndex();
  return get(tex, dx + idx.x, dy + idx.y);
}
