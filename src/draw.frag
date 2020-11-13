#version 300 es

in mediump vec4 genecolor;
out mediump vec4 cellcolor;

void main() {
    cellcolor = genecolor;
}