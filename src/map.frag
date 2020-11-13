#version 300 es

in mediump vec4 mapped;
out mediump vec4 recordcolor;

void main() {
    recordcolor = mapped;
}