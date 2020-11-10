"use strinct"

const I = 2160
const J = 4096
const N = I*J
const cellmax = 2**18
const F = Int32Array


const f = new F(N).fill(0).map(()=>{
    if (Math.random() < 0.99) {
        return (Math.random()*cellmax)|0
    } else {
        return -1
    }
})

function createbuff(field) {
    const N9 = N*9
    const buff = new F(N9)
    
    const T = -1; const B = +1
    const L = -I; const R = I

    let i, j
    let edgeL, edgeR, edgeT, edgeB
    
    for (let n = 0; n < N; n+=9) {
        i = n%I; j = (n/I)|0
        edgeL = j===0; edgeR = j===J-1
        edgeT = i===0; edgeB = i===I-1

        buff[n  ] = edgeL||edgeT ? -1 : field[n+L+T]
        buff[n+1] = edgeL        ? -1 : field[n+L  ]
        buff[n+2] = edgeL||edgeB ? -1 : field[n+L+B]
        buff[n+3] =        edgeT ? -1 : field[n  +T]
        buff[n+4] =                     field[n    ]
        buff[n+5] =        edgeB ? -1 : field[n  +B]
        buff[n+6] = edgeR||edgeT ? -1 : field[n+R+T]
        buff[n+7] = edgeR        ? -1 : field[n+R  ]
        buff[n+8] = edgeR||edgeB ? -1 : field[n+R+B]

    }
    return buff
}

const timestamp = []
const bstart = performance.now()
while (performance.now() - bstart < 5000) {
    const start = performance.now()
    const buff = createbuff(f)
    const end = performance.now()
    timestamp.push(end-start)
}
const mean = timestamp.reduce((sum, elm)=>sum+=elm)/timestamp.length
const median = timestamp[(timestamp.length/2)|0]
const max = timestamp.reduce((max, elm)=>Math.max(max, elm))
const min = timestamp.reduce((min, elm)=>Math.min(min, elm))

const mb = `
ループ回数：${timestamp.length}
最大値：${max} ms
最小値：${min} ms
平均値：${mean} ms
中央値：${median} ms
`

console.log(mb)
