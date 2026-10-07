#ifndef NOISE_GLSL_INCLUDED
#define NOISE_GLSL_INCLUDED

uint pcg(uint v) {
  v = v * 747796405u + 2891336453u;
  uint w = ((v >> ((v >> 28u) + 4u)) ^ v) * 277803737u;
  return (w >> 22u) ^ w;
}

float hash(uvec2 p) { return float(pcg(p.x ^ pcg(p.y))) / 4294967296.0; }

float value_noise(vec2 p) {

  vec2 pos = p + 1000.0;

  uvec2 i = uvec2(floor(pos)); // integer cell coordinates
  vec2 f = fract(pos);         // fractional position within cell

  // Hash 4 corners of cell
  float a = hash(i);                 // bottom-left
  float b = hash(i + uvec2(1u, 0u)); // bottom-right
  float c = hash(i + uvec2(0u, 1u)); // top-left
  float d = hash(i + uvec2(1u, 1u)); // top-right

  // Hermite interpolation (smooth at cell edge, no derivative discontinuity)
  vec2 u = f * f * (3.0 - 2.0 * f); // = smoothstep(0,1,f)
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p, uint octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  float lacunarity = 2.0;

  for (uint i = 0u; i < octaves; i++) {
    value += amplitude * value_noise(p * frequency);
    amplitude *= 0.5;
    frequency *= lacunarity;
  }

  return value;
}

#endif
