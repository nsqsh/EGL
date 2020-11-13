
var scale = {}
var points = []
var field = []

var gl = {}
var shader = {}
var program = {}
var buffer = {}


const cellsize = 8
const foldername = "src"
const shadername = ["draw", "map", "calc"]
const extensions = ["vert", "frag"]

class Scale {
    constructor(d, canvas) {
        this.d = d
        this.H = canvas.clientHeight
        this.W = canvas.clientWidth
        this.WH = [this.W, this.H]
        this.I = Math.ceil(this.H/d)
        this.J = Math.ceil(this.W/d)
        this.IJ = [this.I, this.J]
        this.Hrem = d*this.I - this.H
        this.Wrem = d*this.J - this.W
        this.rem = [this.Wrem, this.Hrem]
        this.N = this.I*this.J
    }
}

initialize()


async function initialize() {
    const glpromise = getcanvas()
    .then( canvas => {
        scale = resize(cellsize, canvas)
        gl = canvas.getContext("webgl2")
        gl.clearColor(0.0, 0.0, 0.0, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        
        points = createvertices(scale)
        field = initfield(scale, 0.3)
    })

    const shadercode = new Array(shadername.length)
    const codepromise = shadername
    .map( name => getsources(name) )
    .map( (shader, i) => 
        shader.then( result => shadercode[i]=result ))

    await Promise.all(codepromise.concat(glpromise))

    shadercode
    .forEach( (code, i) => {
        
        // 暫定
        if (i!==0) return null

        const name = shadername[i]
        const thisbuffer = {}
        shader[name] = create_glprogram(gl, code)
        gl.useProgram(shader.draw);

        border = Math.min(cellsize/50, 3)
        ulocation = gl.getUniformLocation(shader.draw, "cellsize")
        gl.uniform1f(ulocation, cellsize-border)

        thisbuffer.pos = create_glbuffer(gl, shader.draw, "pos", gl.ARRAY_BUFFER, 2, gl.FLOAT)
        set_glvalue(gl, thisbuffer.pos, gl.ARRAY_BUFFER, gl.STATIC_DRAW, points)
        
        thisbuffer.gene  = create_glbuffer(gl, shader.draw, "gene", gl.ARRAY_BUFFER, 1, gl.INT)
        set_glvalue(gl, thisbuffer.gene, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW, field)

        buffer[name] = thisbuffer

        gl.drawArrays(gl.POINTS, 0, points.length/2);
    })
        
}

async function getcanvas() {
    return new Promise(resolve=>{
        window.onload = function(){
            const cvs = document.getElementsByTagName("canvas")[0]
            resolve(cvs)
        }
    })
}

function resize(d, canvas) {
    canvas.height = canvas.clientHeight
    canvas.width = canvas.clientWidth
    return new Scale(d, canvas)
}


function createvertices(scale) {
    const d = scale.d
    const [I, J] = scale.IJ
    const WH = scale.WH
    const WHrem = scale.rem

    const points = new Float32Array(2*scale.N).fill(NaN)
    
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

async function getsources(shadername) {
    const requests = extensions
    .map( ext => foldername+"/"+shadername+"."+ext )
    .map( filename => fetch(filename) )
    
    const texts = requests
    .map(
        request => (
            request.then( response => response.text() )
        ));

    return Promise
    .all(texts)
    .catch(
        err => [
            shadercode[vert_filename].vert,
            shadercode[vert_filename].frag
        ]
    );
}

function create_glprogram(gl, sources) {
    const shaders = [
        gl.createShader(gl.VERTEX_SHADER), 
        gl.createShader(gl.FRAGMENT_SHADER)]

    const program = gl.createProgram()
    
    sources.forEach(
        (code, i) => {
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

    return program
}

function create_glbuffer(gl, program, varname, buff_type, buff_ellength, buff_eltype) {
    const int_enums = [
        gl.BYTE, gl.UNSIGNED_BYTE,
        gl.SHORT, gl.UNSIGNED_SHORT,
        gl.INT, gl.UNSIGNED_INT]
    const float_enums = [
        gl.FLOAT, gl.HALF_FLOAT]

    const buffer = gl.createBuffer()
    const location = gl.getAttribLocation(program, varname)

    gl.bindBuffer(buff_type, buffer)
    gl.enableVertexAttribArray(location)
    if (float_enums.includes(buff_eltype)) {
        gl.vertexAttribPointer(location, buff_ellength, buff_eltype, false, 0, 0)
    } else if (int_enums.includes(buff_eltype)){
        gl.vertexAttribIPointer(location, buff_ellength, buff_eltype, 0, 0)
    }
    gl.bindBuffer(buff_type, null)

    return buffer
}

function set_glvalue(gl, buffer, buff_type, usage, values) {
    gl.bindBuffer(buff_type, buffer)
    gl.bufferData(buff_type, values, usage)
    gl.bindBuffer(buff_type, null)
}
