window.onload = main

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

async function main() {

    const cellsize = 10

    const cvs = document.getElementsByTagName("canvas")[0]
    scale = resize(cellsize, cvs)

    gl = cvs.getContext("webgl2")
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    
    const sources = await getsources("pos.vert", "color.frag")
    program = construct_program(gl, sources)
    
    points = createpoints(scale)
    
    const points_buff = create_attrbuffer(gl, program, "pos", 2, gl.FLOAT, gl.ARRAY_BUFFER)
    set_attrbuffer(gl, points_buff, points, gl.STATIC_DRAW, gl.ARRAY_BUFFER)

    border = Math.min(cellsize/50, 3)
    const ulocation = gl.getUniformLocation(program, "cellsize")
    gl.uniform1f(ulocation, cellsize - border)

    f = randfield(scale)

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
    console.log(location)
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



function randfield(scale) {
    const f = new Int16Array(scale.I*scale.J*2).fill(0x00)
    return f.map(elm => (Math.random()*513 - 1)|0)
}


function debug(text, clear=false) {
    const d = document.getElementById("debug")
    if (clear) {
        d.innerText = text
    } else {
        d.innerText += ("\n" + text)
    }
}