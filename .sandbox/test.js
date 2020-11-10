const I = 2160
const J = 4096
const N = I*J
const cellmax = 2**31
const F = Int32Array

const loopcount = 1

const f = new F(N).fill(0).map(elm=>Math.random()*cellmax|0)
const f2 = new Array(J).fill([]).map(
    row => new F(I).fill(-1).map(
        cell => (cellmax*Math.random()|0)
    )
)

function createbuff(field) {
    const buff = new F(N*9)
    for (let i = 0; i < I; i++) {

        let topedge = (i===0)
        let bottomedge = (i===I-1)
        for (let j = 0; j < J; j++) {
            let leftedge = (j===0)
            let rightedge = (j===J-1)            

            let n = (i*J + j)

            buff[n] = (leftedge||topedge) ? -1 : field[j-1][i-1]
            buff[n+1] = (leftedge) ? -1 : field[j-1][i]
            buff[n+2] = (leftedge||bottomedge) ? -1 : field[j-1][i+1]
            buff[n+3] = (topedge) ? -1 : field[j][i-1]
            buff[n+4] = field[j][i]
            buff[n+5] = (bottomedge) ? -1 : field[j][i+1]
            buff[n+6] = (rightedge||topedge) ? -1 : field[j+1][i-1]
            buff[n+7] = (rightedge) ? -1 : field[j+1][i]
            buff[n+8] = (rightedge||bottomedge) ? -1 : field[j+1][i+1]

            n += 9
        }
    }
    return buff
}


bstart = performance.now()
buff = createbuff(f2)
bend = performance.now()

console.log(bend-bstart)
