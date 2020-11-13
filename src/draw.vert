#version 300 es

#define GENELEN (18)
#define GENE_HALFLEN (GENELEN/2)
#define ALIVE (0)
#define BORN = GENE_HARFLEN
#define MAX_RGB_ELM float(GENELEN/3)

uniform mediump float cellsize;
in mediump vec2 pos;
in highp int gene;
out mediump vec4 genecolor;

vec4 gene2color(const in int gene) {
    lowp int alive = int(!(gene < 0));

    lowp int flag = 0;
    highp int mask = 0;
    lowp int rgb_index = 0;
    lowp ivec3 rgb = ivec3(0, 0, 0);

    for (int bit = 0; bit < GENELEN; bit++) {
        mask = 1 << bit;
        flag = ((gene & mask) >> bit);
        rgb_index = (bit%GENE_HALFLEN)/3;
        rgb[rgb_index] += alive*flag;
    }

    vec4 rgba = vec4(
        float(rgb.r)/MAX_RGB_ELM,
        float(rgb.g)/MAX_RGB_ELM,
        float(rgb.b)/MAX_RGB_ELM,
        1.0);

    return rgba;
}

void main() {
    genecolor = gene2color(gene);
    gl_PointSize = cellsize;
    gl_Position = vec4(pos, 0.0, 1.0);
}