var gl = {}
var scale = {}
var points = []
var shader = {}

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

main()

async function main() {
    const glpromise = getgl()
    .then( result => {
        gl = result
        scale = resize(cellsize, gl.canvas)
        points = createvertices(scale)
        field = initfield(scale, 0.3)
    })

    const shadercode = new Array(shadername.length)
    const codepromise = shadername
    .map( name => getsources(name) )
    .map(
        (shader, i) => 
            shader.then( result => shadercode[i]=result ))
    
    Promise
    .all([glpromise, codepromise])
    .then(()=>{
        shadercode
        .map(
            (code, i) => {
                shader[shadername[i]] = construct_program(gl, code)
            })
        })
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


async function getgl() {
    return new Promise(resolve=>{
        window.onload = function(){
            const cvs = document.getElementsByTagName("canvas")[0]
            const gl = cvs.getContext("webgl2")
            gl.clearColor(0.0, 0.0, 0.0, 1.0)
            gl.clear(gl.COLOR_BUFFER_BIT)

            resolve(gl)
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

function construct_program(gl, sources) {
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

    gl.useProgram(program);

    return program
}