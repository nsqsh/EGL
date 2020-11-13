#version 300 es

#define GENELEN (18)
#define COLORLEN (GENELEN/3)
#define MAPMASK (0x3F) // COLORLEN bitのマスク
#define DEADCOLOR (0xFF)
#define COLORMAX (256.0)

in highp int gene;
out mediump vec4 mapped;

void main() {
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
    mapped.a = 0.0;    
}