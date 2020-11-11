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

function calcnextfield(field, scale) {
    const N = scale.N
    const I = scale.I; const J = scale.J
    const nextfield = new Field(N)
    let neighbors = []
    let cell = new Field(2)
    let nextcell = new Field(2)

    for (let n = 0; n < N; n+=2) {
        cell = [field[n+BORN], field[n+ALIVE]]

        neighbors = getneighbors(field, n, I, J)
        nextcell = calcnextcell(cell, neighbors)

        nextfield[n+BORN] = nextcell[BORN]
        nextfield[n+ALIVE] = nextcell[ALIVE]
    }
    return nextfield
}


function getneighbors(field, n, I, J) {
   
    const N = 2*I*J
    const L = -2; const R = 2
    const B = 2*J; const T = -2*J

    const on_L_edge = ( n%B == 0 )
    const on_R_edge = ( n%B == (J-1) )
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

function calcnextcell(cell, neighbors) {
    const neighborcount = neighbors.length

    if (!(cell[0] < 0)) {
        if (isalivenext(cell[ALIVE], neighborcount)) {
            return cell
        } else {
            return new Field(2).fill(-1)
        }
    } else {
        if (neighborcount == 0) {
            return new Field(2).fill(-1)
        } else {
            const child = breed(neighbors)
            if (isalivenext(child[BORN], neighborcount)) {
                return child
            } else {
                return new Field(2).fill(-1)
            }
        }

    }
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