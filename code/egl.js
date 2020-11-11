const BORN = 0
const ALIVE = 1

const Field = Int16Array
const adam = new Field([0b000001000, 0b000001100]);


const cellsize = 8

class Scale {
    constructor(d, canvas) {
        this.d = d
        this.H = canvas.clientHeight
        this.W = canvas.clientWidth
        this.I = Math.ceil(this.H/d)
        this.J = Math.ceil(this.W/d)
        this.Hrem = d*this.I - this.H
        this.Wrem = d*this.J - this.W
        this.N = 2*this.I*this.J
    }
}

window.onload = main

// debug
// window.onclick = function(){
//     f = calcnextfield(f, scale)
//     set_attrbuffer(gl, genes_buff, f, gl.STATIC_DRAW, gl.ARRAY_BUFFER)
//     gl.drawArrays(gl.POINTS, 0, points.length/2);
// }

async function main() {

    const cvs = document.getElementsByTagName("canvas")[0]
    const sources = await getsources("pos.vert", "color.frag")
    
    scale = resize(cellsize, cvs)

    gl = cvs.getContext("webgl2")
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    
    
    program = construct_program(gl, sources)
    
    points = createpoints(scale)
    f = initfield(scale, 0.3)
    
    const points_buff = create_attrbuffer(gl, program, "pos", 2, gl.FLOAT, gl.ARRAY_BUFFER)
    set_attrbuffer(gl, points_buff, points, gl.STATIC_DRAW, gl.ARRAY_BUFFER)

    border = Math.min(cellsize/50, 3)
    const ulocation = gl.getUniformLocation(program, "cellsize")
    gl.uniform1f(ulocation, cellsize-border)

    genes_buff = create_attrbuffer(gl, program, "vgene", 2, gl.SHORT, gl.ARRAY_BUFFER)
    set_attrbuffer(gl, genes_buff, f, gl.STATIC_DRAW, gl.ARRAY_BUFFER)

    gl.drawArrays(gl.POINTS, 0, points.length/2);
    gl.flush();
}
 

function resize(d, canvas) {
    canvas.height = canvas.clientHeight
    canvas.width = canvas.clientWidth
    return new Scale(d, canvas)
}

async function getsources(vert_filename, frag_filename) {
    const filenames = [vert_filename, frag_filename]
    const requests = filenames.map(filename=>fetch(filename))
    
    const texts = requests.map(
        request => (request.then(
            response => response.text())));

    return Promise.all(texts).catch(
        err => [vshadertext, fshadertext])
}

function construct_program(gl, sources) {
    const shaders = [
        gl.createShader(gl.VERTEX_SHADER), 
        gl.createShader(gl.FRAGMENT_SHADER)]

    const program = gl.createProgram()
    
    sources.forEach((code, i)=>{
        gl.shaderSource(shaders[i], code)
        gl.compileShader(shaders[i])
        
        // debug
        console.assert(gl.getShaderParameter(shaders[i], gl.COMPILE_STATUS))
        let log = gl.getShaderInfoLog(shaders[i])
        if (log) console.warn(log)

        gl.attachShader(program, shaders[i])
    })
    gl.linkProgram(program)

    // debug
    console.assert(gl.getProgramParameter(program, gl.LINK_STATUS))
    let log = gl.getProgramInfoLog(program)
    if (log) console.warn(log)

    gl.useProgram(program);

    return program
}

function createpoints(scale) {
    const I = scale.I; const J = scale.J
    const d = scale.d
    const WH = [scale.W, scale.H]
    const WHrem = [scale.Wrem, scale.Hrem]

    const points = new Float32Array(I*J*2).fill(NaN)
    
    let n = 0
    for (let i = 0; i < I; i++) {
    for (let j = 0; j < J; j++) {
        const xy = wh2xy(ij2wh([i,j], d, WHrem), WH)
        points[n] = xy[0]
        points[n+1] = xy[1]
        n += 2
    }}

    return points.filter(elm=>!isNaN(elm))
}

function ij2wh(ij, d, WHrem) {
    return [
        (ij[1]+0.5)*d - (WHrem[0]/2)|0,
        (ij[0]+0.5)*d - (WHrem[1]/2)|0
    ]
}

function wh2xy(wh, WH) {
    return [
        2*wh[0]/WH[0] - 1,
        1 - 2*wh[1]/WH[1]
    ]
}


function create_attrbuffer(gl, program, varname, buff_elmlength, buff_elmtype, buff_target) {
    const int_enums = [
        gl.BYTE, gl.UNSIGNED_BYTE,
        gl.SHORT, gl.UNSIGNED_SHORT,
        gl.INT, gl.UNSIGNED_INT]
    const float_enums = [
        gl.FLOAT, gl.HALF_FLOAT]

    const buffer = gl.createBuffer()
    const location = gl.getAttribLocation(program, varname)

    gl.bindBuffer(buff_target, buffer)
    gl.enableVertexAttribArray(location)
    if (float_enums.includes(buff_elmtype)) {
        gl.vertexAttribPointer(location, buff_elmlength, buff_elmtype, false, 0, 0)
    } else if (int_enums.includes(buff_elmtype)){
        gl.vertexAttribIPointer(location, buff_elmlength, buff_elmtype, 0, 0)
    }
    gl.bindBuffer(buff_target, null)

    return buffer
}

function set_attrbuffer(gl, buffer, values, usage, buff_target) {
    gl.bindBuffer(buff_target, buffer)
    gl.bufferData(buff_target, values, usage)
    gl.bindBuffer(buff_target, null)
}


function debug(text, clear=false) {
    const d = document.getElementById("debug")
    if (clear) {
        d.innerText = text
    } else {
        d.innerText += ("\n" + text)
    }
}




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