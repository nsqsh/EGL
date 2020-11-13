#version 300 es

in highp int gene;
flat out highp int record;

void main() {
    record = gene;
}