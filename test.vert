#version 300 es
in vec2 pos;
out vec4 vcolor;

void main() {
    vcolor = vec4(1.0);
    gl_PointSize = 10.0;
    gl_Position = vec4(pos, 0.0, 1.0);
}
