const BORN = 0
const ALIVE = 1

const Field = Int16Array
const adam = new Field([0b000001000, 0b000001100]);

function initfield(scale, density) {
    const N = scale.N;
    const f = new Field(scale.I*scale.J*2).fill(-1)
    for (let n = 0; n < N; n+=2) {
        if (Math.random() < density) {
            f[n] = adam[0]
            f[n+1] = adam[1]
        }
    }
    return f
}

function nextfield(field, scale) {
    const N = scale.N
    const I = scale.I; const J = scale.J
    const nextfield = new Field(N)
    let alive = false
    let neighbors = []
    let child = []
    let neighborcount = 0
    let alivenext = false
    for (let n = 0; n < N; n+=2) {
        alive = !(field[n] < 0)
        neighbors = getneighbors(field, n, I, J)
        neighborcount = neighbors.length

        if (alive) {
            alivenext = isalivenext(field[n+ALIVE], neighborcount)
            if (alivenext) {
                nextfield[n] = field[n]
                nextfield[n+1] = field[n+1]
            } else {
                nextfield[n] = -1
                nextfield[n+1] = -1
            }
        } else {
            if (neighborcount == 0) {
                nextfield[n] = -1
                nextfield[n+1] = -1
            } else {
                child = breed(neighbors)
                alivenext = isalivenext(child[BORN], neighborcount)
                if (alivenext) {
                    nextfield[n+BORN] = child[BORN]
                    nextfield[n+ALIVE] = child[ALIVE]
                } else {
                    nextfield[n] = -1
                    nextfield[n+1] = -1
                }
            }

        }
        
    }

    return nextfield
}

function getneighbors(field, n, I, J) {
   
    const N = 2*I*J
    const L = -2; const R = 2
    const B = 2*J; const T = -2*J

    const on_L_edge = ( (n/2)%J == 0 )
    const on_R_edge = ( (n/2)%J == (J-1) )
    const on_T_edge = (n+T < 0)
    const on_B_edge = (N <= n+B)


    const neighbors = new Array(8).fill(null)
    let count = 0
    let m = 0
    for (let i of [T, 0, B]) {
    for (let j of [L, 0, R]) {
        if (i==0 && j==0) continue
        if (on_T_edge && i==T) continue
        if (on_B_edge && i==B) continue
        if (on_L_edge && j==L) continue
        if (on_R_edge && j==R) continue
        
        m = n+i+j
        if (field[m] < 0 || field[m+1] < 0) continue

        neighbors[count] = new Field([field[m], field[m+1]])
        count++
    }}
    return neighbors.filter(elm=>elm!=null)
}

function isalivenext(genom, neighborcount) {
    if (genom < 0) return false
    const mask = (0b1 << neighborcount)
    return ( (genom & mask) != 0 )
}

function breed(neighbors) {
    const count = neighbors.length
    let mask = 0b0
    let parent = neighbors[0]
    const child = new Field([0x00, 0x00])
    for (let state of [BORN, ALIVE]) {
    for (let gene = 0; gene < 9; gene++) {
        mask = (0b1 << gene)
        if (count > 1) {
            parent = neighbors[(count*Math.random())|0]
        }
        if ((parent[state]&mask) != 0) {
            child[state] = (child[state] | mask)
        }
    }}
    return child
}