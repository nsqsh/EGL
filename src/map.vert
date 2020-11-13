#version 300 es

#define GENELEN (18)
#define COLORLEN (GENELEN/3)
#define MAPMASK (0x3F) // COLORLEN bitのマスク
#define DEADCOLOR (0xFF)
#define COLORMAX (256.0)

uniform mediump ivec2 IJ;
in highp int gene;
out mediump vec4 mapped;

vec4 maptocolor(const in highp int gene) {
    mediump vec4 mapped = vec4(0.0);

    lowp int alive = int(gene >= 0);
    lowp int dead = int(gene < 0);

    lowp int shiftwidth;
    highp int masked;
    lowp int colorint_elm;
    for (int i_color = 0; i_color < 3; i_color++) {
        shiftwidth = i_color*COLORLEN;
        masked = gene & (MAPMASK << shiftwidth);
        colorint_elm = (masked >> shiftwidth);
        colorint_elm = alive*colorint_elm + dead*DEADCOLOR;

        mapped[i_color] = float(colorint_elm)/COLORMAX;
    }

    return mapped;
}

vec4 id2pixpos(const in int vid) {
    mediump int I = IJ[0];
    mediump int J = IJ[1];
    highp float x = 2.0*float(vid % I)/float(I) - 1.0;
    highp float y = (-2.0)*float(vid / I)/float(J) + 1.0;
    return vec4(x, y, 0.0, 1.0);
}

void main() {
    mapped = maptocolor(gene);

    gl_PointSize = 1.0;
    gl_Position = id2pixpos(gl_VertexID);
}