/***********************************************************
    シェーダコード
    fetchが使えない環境用
***********************************************************/

const vshadertext = 
`#version 300 es

#define STATE_SIZE (2)
#define GENE_SIZE (9)
#define MAX_RGB_ELM float((GENE_SIZE/3)*STATE_SIZE)
#define isalive(gene) (gene[0] < 0)

uniform float cellsize;
in vec2 pos;
in ivec2 vgene;
out vec4 vcolor;

vec4 gene2color(const in ivec2 gene) {
    int alive = int(!isalive(gene));

    int codon = 0;
    int mask = 0;
    int color = 0;
    ivec3 rgb = ivec3(0, 0, 0);
    
    for (int s = 0; s < STATE_SIZE; s++) {
    for (int g = 0; g < GENE_SIZE; g++) {
        mask = 1 << g;
        codon = (gene[s] & mask) >> g;
        
        color = g/3;

        rgb[color] += alive*codon;
    }}

    vec4 rgba = vec4(
        float(rgb.r)/MAX_RGB_ELM,
        float(rgb.g)/MAX_RGB_ELM,
        float(rgb.b)/MAX_RGB_ELM,
        1.0);

    return rgba;
}


void main() {
    vcolor = gene2color(vgene);
    gl_PointSize = cellsize;
    gl_Position = vec4(pos, 0.0, 1.0);
}`;

const fshadertext =
`#version 300 es
precision mediump float;

in vec4 vcolor;
out vec4 fcolor;

void main() {
    fcolor = vcolor;
}`