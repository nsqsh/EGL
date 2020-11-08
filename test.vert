#version 300 es
in vec2 pos;

void main() {
    gl_PointSize = 10.0;
    gl_Position = vec4(pos, 0.0, 1.0);
}
