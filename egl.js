function randfield(scale) {
    const f = new Int16Array(scale.I*scale.J*2).fill(0x00)
    return f.map(elm => (Math.random()*513 - 1)|0)
}
