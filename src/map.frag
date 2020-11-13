#version 300 es

flat in highp int record;
out highp int texel;

void main() {
    texel = record;
}