#version 450
#extension GL_GOOGLE_include_directive : require

#include <noise.glsl>
#include <shadertoy.glsl>

// SDFs from Part III
float sdf_circle(vec2 p, float r) { return length(p) - r; }
float op_union(float d1, float d2) { return min(d1, d2); }
float op_subtract(float d1, float d2) { return max(d1, -d2); }
float op_intersect(float d1, float d2) { return max(d1, d2); }
vec3 contours(float d) {
  vec3 col = (d < 0.0) ? vec3(0.90, 0.55, 0.25) : vec3(0.25, 0.45, 0.80);
  col *= 1.0 - exp(-6.0 * abs(d));
  col *= 0.85 + 0.15 * cos(d * 62.831853);
  return mix(col, vec3(1.0), 1.0 - smoothstep(0.0, 0.012, abs(d)));
}
vec2 ball_center() {
  if (iMouse.z > 0.0)
    return (2.0 * iMouse.xy - u.resolution) / u.resolution.y;
  return vec2(0, 0.15 * sin(u.time));
}
float sdf_box(vec2 p, vec2 hs) {
  vec2 d = abs(p) - hs;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
float sdf_rounded_box(vec2 p, vec2 hs, float r) {
  vec2 q = abs(p) - hs + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
vec2 op_smooth_union_color(float d1, float d2, float k) {
  float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
  float d = mix(d2, d1, h) - k * h * (1.0 - h);
  return vec2(d, h);
}

// Main code
void mainImage(out vec4 fragColor, in vec2 fragCoord) {

  vec2 p = (2.0 * fragCoord.xy - u.resolution) / u.resolution.y;

  // Aspect of window
  float aspect = u.resolution.x / u.resolution.y;
  // Noise create using fbm function
  float n = fbm(p * 1.5 + u.time, u.octaves) * 0.3;

  // A rectangle that have screen's size
  float base = sdf_box(p, vec2(aspect, 1.0));
  // A rectangle for create space in the center
  float boxhole = sdf_rounded_box(p, vec2(aspect * 0.8, 0.8), 0.08) - n;
  // rounded rectangle frame
  float bg = op_subtract(base, boxhole);
  // A circle that move along with mouse
  float circle = op_subtract(
      op_union(op_subtract(sdf_circle(p - ball_center(), 0.2) - n * 2,
                           sdf_circle(p - ball_center(), 0.15) - n * 1.5),
               sdf_circle(p - ball_center(), 0.07) - n),
      sdf_circle(p - ball_center(), 0.02) - n);

  // All object in scene
  float finalscene = op_smooth_union_color(bg, circle, 0.50).x;

  float w = fwidth(finalscene);

  // Background color
  vec3 bgColor = vec3(0.18 - n, 0.14 - n, 0.25 - n) + 0.03;

  vec3 col = vec3(0.0);

  if (iMode == 0u) {

    // Calculate Outer Glow
    float glow = exp(-12.0 * max(finalscene, 0.0));
    vec3 glowColor = vec3(1.0, 0.45, 0.1) * glow;

    // Calculate inner glow (Lava effect)
    float innerLava = smoothstep(0.02, -0.2, finalscene);

    // Inner Gradient (Core Glow)
    vec3 coreColor =
        mix(vec3(1.0, 0.4, 0.1), vec3(1.0, 0.95, 0.5), innerLava + n);
    coreColor += vec3(0.3, 0.1, 0.0) * n; // Add noise for lava effect

    // Sum of outer glow and object
    if (finalscene < 0.0) {
      col = coreColor + glowColor * 0.5; // Outter glow
    } else {
      col = mix(bgColor, glowColor, glow); // Object
    }
  } else if (iMode == 1u)
    col = contours(finalscene);
  else if (iMode == 2u)
    col = vec3(clamp(finalscene * 0.5 + 0.5, 0.0, 1.0));
  else if (iMode == 3u)
    col = vec3(w * 50.0);

  fragColor = vec4(col, 1.0);
}
