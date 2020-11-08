window.onload = main

class Scale {
    constructor(d, canvas) {
        this.d = d
        this.H = canvas.clientHeight
        this.W = canvas.clientWidth
        this.I = Math.ceil(this.H/d)
        this.J = Math.ceil(this.W/d)
        this.N = 2*this.I*this.J
    }
}

async function main() {
    cellsize = 300

    cvs = document.getElementsByTagName("canvas")[0]
    scale = resize(cellsize, cvs)

    gl = cvs.getContext("webgl2")
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    sources = await getsources("test.vert", "test.frag")
    program = construct_program(gl, sources)
    
    p = createpoints(scale)

    attLocation = gl.getAttribLocation(program, "pos")
    attStride = 2

    vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, p, gl.STATIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    // VBOをバインド
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    // attribute属性を有効にする
    gl.enableVertexAttribArray(attLocation);
    // attribute属性を登録
    gl.vertexAttribPointer(attLocation, attStride, gl.FLOAT, false, 0, 0)

    gl.drawArrays(gl.POINTS, 0, p.length/2);
    gl.flush();
}












function resize(d, canvas) {
    canvas.height = canvas.clientHeight
    canvas.width = canvas.clientWidth
    return new Scale(d, canvas)
}

async function getsources(vert_filename, frag_filename) {
    
    vertpromise = new Promise(function(resolve){
        const xhr = new XMLHttpRequest()
        xhr.open("GET", vert_filename)
        xhr.send()
        xhr.onload = function(){
            resolve(xhr.responseText)
        }
    })

    fragpromise = new Promise(function(resolve){
        const xhr = new XMLHttpRequest()
        xhr.open("GET", frag_filename)
        xhr.send()
        xhr.onload = function(){
            resolve(xhr.responseText)
        }
    })

    return Promise.all([vertpromise, fragpromise])
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

    const points = new Float32Array(I*J*2).fill(NaN)
    
    let n = 0
    for (let i = 0; i < I; i++) {
    for (let j = 0; j < J; j++) {
        const xy = wh2xy(ij2wh([i,j], d), WH)
        points[n] = xy[0]
        points[n+1] = xy[1]
        n += 2
    }}

    return points.filter(elm=>!isNaN(elm))
}

function ij2wh(ij, d) {
    return [
        (ij[1]+0.5)*d,
        (ij[0]+0.5)*d
    ]
}

function wh2xy(wh, WH) {
    return [
        2*wh[0]/WH[0] - 1,
        1 - 2*wh[1]/WH[1]
    ]
}


function randfield(scale) {
    const f = new Int32Array(scale.N).fill(0x00)
    return f.map(elm => (Math.random()*513 - 1)|0)
}

