#version 300 es

#define n (gl_VertexID)
#define I (IJ[0])
#define J (IJ[1])
#define i (ij[0])
#define j (ij[1])

#define U (vec2(-1, 0))
#define D (vec2(1, 0))
#define L (vec2(0, -1))
#define R (vec2(0, 1))
#define UL (U+L)
#define UR (U+R)
#define DL (D+L)
#define DR (D+R)

#define DEAD (-1)

#define GENELEN (18)
#define GENE_HALFLEN (GENELEN/2)

#define isalive(gene) int(gene >= 0)
#define not(alive) int(alive==0)
#define xor(a, b) ((a|b) & ~(a&b))

uniform mediump ivec2 IJ;
uniform highp isampler2D record;
uniform highp int time;

flat out highp int nextcell;

lowp int countneighbor(
    in highp ivec3 row
) {
    lowp int alive;
    lowp int count = 0;
    for (int k = 0; k < 3; k++) {
        alive = isalive(row[k]);
        count += alive;
    }
    return count;
}

lowp int isalivenext(
    in highp int gene,
    in lowp int alive,
    in lowp int neighbor
) {
    highp int mask = 1 << (neighbor + alive*GENE_HALFLEN);
    return int((gene&mask) != 0);
}

highp int nextrand(
    highp int state
) {
    state = xor(state, (state << 13));
    state = xor(state, (state >> 17));
    state = xor(state, (state << 5));
    return state;
}

highp int choiceparent(
    in highp ivec3 upper,
    in highp ivec3 middle,
    in highp ivec3 lower,
    lowp int rand8
) {
    lowp int ul = int(rand8==0);
    lowp int u = int(rand8==1);
    lowp int ur = int(rand8==2);
    lowp int l = int(rand8==3);
    lowp int r = int(rand8==4);
    lowp int dl = int(rand8==5);
    lowp int d = int(rand8==6);
    lowp int dr = int(rand8==7);

    highp int parent = 
        ul*upper[0] + u*upper[1] + ur*upper[2] +
        l*middle[0]              + r*middle[2] +
        dl*lower[0] + d*lower[1] + dr*lower[2];
    
    return parent;
}

highp int breed(
    in highp ivec3 upper,
    in highp ivec3 middle,
    in highp ivec3 lower,
    in highp int randstate
) {
    highp int parent;
    highp int rand = randstate;
    lowp int rand8;
    highp int mask;
    lowp int isone;
    highp int child = 0;
    for (int bit = 0; bit < GENELEN; bit++) {
        parent = -1;
        while (parent != -1) {
            rand = nextrand(rand);
            rand8 = (rand & 7);
            parent = choiceparent(upper, middle, lower, rand8);
        }

        mask = (1 << bit);
        isone = ((mask & parent) >> bit);
        child = (child | (isone*mask));
    }
    return child;
}


void main() {

    ivec2 ij = ivec2(n%I, n/I);
    vec2 ij_f = vec2(float(i), float(j));

    highp int gene = texture(record, ij_f).r;

    lowp int alive = isalive(gene);

    highp ivec3 upper = ivec3(
        texture(record, ij_f+UL).r,
        texture(record, ij_f+U).r,
        texture(record, ij_f+UR).r
    );
    highp ivec3 middle = ivec3(
        texture(record, ij_f+L).r,
        gene,
        texture(record, ij_f+R).r
    );
    highp ivec3 lower = ivec3(
        texture(record, ij_f+DL).r,
        texture(record, ij_f+D).r,
        texture(record, ij_f+DR).r
    );

    lowp int neighbor
        = countneighbor(upper)
        + countneighbor(middle)
        + countneighbor(lower)
        - alive;
    
    lowp int alivenext = 0;
    if (gene >= 0) {
        alivenext = isalivenext(gene, alive, neighbor);
        nextcell = alivenext*gene + not(alivenext)*DEAD;
    } else if (neighbor==0) {
        nextcell = DEAD;
    } else {
        highp int randstate = time + gl_VertexID;
        highp int child = breed(upper, middle, lower, randstate);
        lowp int alivenext = isalivenext(child, 0, neighbor);
        nextcell = alivenext*child + not(alivenext)*DEAD;
    }



}