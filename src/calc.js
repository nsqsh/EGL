const GENELEN = 18
const ALIVE = 0
const BORN = GENELEN/2

const Field = Int32Array
const adam = function(){
    const genom = [
        [ALIVE, 2],[ALIVE, 3],
        [BORN, 3]
    ];
    let cell = 0
    for (let gene of genom) {
        const bit = 1 << (gene[0] + gene[1])
        cell = cell | bit
    }
    return cell
}();


function initfield(scale, density) {
    const N = scale.N;
    const field = new Field(N).fill(-(2**31)).map(
        cell => Math.random() < density ? adam : -1)
    return field
}