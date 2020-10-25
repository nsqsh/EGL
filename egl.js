/*- 定数 -----------------------------------------------*/
// レイヤー枚数
const LAYERLEN = 2

// 初期密度
const density = 0.1
// セルの型
const Cell = Uint8Array
// セルの長さ
const CELLLEN = 4
// 無効な遺伝子の下限
const DEADGENE = 9
// 初期配置セル
const adam = new Cell([2, 3, 3, 3])

// セルのインデックス
// 生存時、近隣の生存セル数 n が
//     cell[AL] <= n <= cell[AR]
// ならば次ステップでも生存
// 死亡時、近隣の生存セル数 n が
//     cell[BL] <= n <= cell[BR]
// ならば次ステップで誕生
const AL = 0; const AR = 1
const BL = 2; const BR = 3

// セルのRGB色
const RGB = Uint8Array


/*- 変数 -----------------------------------------------*/

// ループ用インデックス
var i = 0; var j = 0;
var k = 0; var l = 0;
var m = 0; var n = 0;
var w = 0; var h = 0;
var dw = 0; var dh = 0;

// スケール変数
// d: セル1辺の長さ  N: 画像データ長
// H: キャンバスサイズ縦  W: キャンバスサイズ横
// I: 縦セル数  J: 横セル数
var d = 1; var N = 0
var H = 0; var W = 0
var I = 0; var J = 0

// レイヤー配列
const ctx = new Array(LAYERLEN)
// 線形画像データ
const img = new Array(LAYERLEN)
// セルから色への変換キャッシュ
const rgbcache = {}
// 色用一時変数
var rgb = new RGB(3).fill(0x00)
// フィールド配列
const field = new Array(LAYERLEN)
// セル用一時変数
var cell = new Cell(adam)
// 近隣セル用一時変数
var neighbors = (new Array(8)).fill([]).map(neib=>new Cell(adam))
// 近隣セル生存数用一時変数
var neibcount = 0
// 前ステップ状態用一時変数
var aliveprev = false
// 次ステップ状態用一時変数
var alivenext = false
// 親セル用一時変数
var parent = new Cell(adam)
// 子セル用一時変数
var child = new Cell(adam)

// 描画間隔 (msec)
var period = 1000


/*- 関数 -----------------------------------------------*/


window.onload = ()=>{
    initialize()
}

// 初期化関数
// Canvasの取得～初期フィールドの表示
function initialize() {
    initctx()
    initsize()
    initimg()
    initfield()
    convertfield(1)
    draw(1)
    display(1, 0)
    start(0, 1); start(1, 0)

}

// click = 1
// onclick = ()=>{
//     start(click%2, (click-1)%2)
//     click++
// }

// Canvasの取得
function initctx() {
    const cvs = document.getElementsByTagName("canvas")
    for (n = 0; n < LAYERLEN; n++) {
        ctx[n] = cvs[n].getContext("2d")
        ctx[n].canvas.style.visibility = "hidden"
        ctx[n].complete = true
        ctx[n].timestamp = 0
    }
}

// サイズの取得
function initsize() {
    d = d
    W = window.innerWidth
    H = window.innerHeight
    I = Math.ceil(H/d)
    J = Math.ceil(W/d)
    N = W*H*4

    for (n = 0; n < LAYERLEN; n++) {
        ctx[n].canvas.width = W
        ctx[n].canvas.height = H
    }
}

// 画像コンテナの初期化
function initimg() {
    for (m = 0; m < LAYERLEN; m++) {
        img[m] = ctx[m].getImageData(0, 0, W, H)
        for (n = 3; n < N; n += 4) {
            img[m].data[n] = 0xFF
        }
        img[m].drawn = true
    }
}

// フィールドの初期化
function initfield() {
    for (n = 0; n < LAYERLEN; n++) {
        field[n] = new Array(I)
        for (i = 0; i < I; i++) {
            field[n][i] = new Array(J)
            for (j = 0; j < J; j++) {
                if (Math.random() < density) {
                    field[n][i][j] = new Cell(adam)
                } else {
                    field[n][i][j] = new Cell(CELLLEN).fill(DEADGENE)
                }
            }
        }
        field[n].used = true
        field[n].converted = true
    }
    field[1].converted = false
    field[1].used = false
}

// フィールドを画像データに変換
function convertfield(layer) {
    if (d === 1) {
        for (i = 0; i < I; i++) {
        for (j = 0; j < J; j++) {
            cell = field[layer][i][j]
            rgb = rgbcache[cell]
            color = rgb ? rgb : cell2color() 
            h = i*d; w = j*d
            n = (W*h + w)*4
            img[layer].data[n] = color[0]
            img[layer].data[n+1] = color[1]
            img[layer].data[n+2] = color[2]
        }}
    } else {
        for (i = 0; i < I; i++) {
        for (j = 0; j < J; j++) {
            cell = field[layer][i][j]
            rgb = rgbcache[cell]
            color = rgb ? rgb : cell2color() 
            h = i*d; w = j*d
            for (dh = 0; (dh < d)&&(h + dh < H); dh++) {
            for (dw = 0; (dw < d)&&(w + dw < W); dw++) {
                n = (W*(h + dh) + (w + dw))*4
                img[layer].data[n] = color[0]
                img[layer].data[n+1] = color[1]
                img[layer].data[n+2] = color[2]
            }}
        }}
    }
    field[layer].converted = true
    img[layer].drawn = false
}

function draw(layer) {
    ctx[layer].putImageData(img[layer], 0, 0)
    img[layer].drawn = true
    ctx[layer].complete = false
}



function cell2color() {
    if (!isalive(cell)) {
        rgbcache[cell] = new RGB([0,0,0])
    } else {
        const range = (cell[AR] - cell[AL]) + (cell[BR] - cell[BL])
        const center = (cell[AL] + cell[AR] + cell[BL] + cell[BR])
        const h = (center/32)*270
        const l = 0.05+0.95*(range/16)
        const rgb = hsl2rgb(h, 1, l)
        rgbcache[cell] = rgb
    }
    return rgbcache[cell]
}

function isalive(cell) {
    return (cell[0] < DEADGENE)
}

function hsl2rgb(hue, sat, lum) {
    let r = 0x00; let g = 0x00; let b = 0x00

    const max = lum + sat*(0.5 - Math.abs(lum - 0.5))
    const min = lum - sat*(0.5 - Math.abs(lum - 0.5))
    const diff_div60 = (max - min)/60
    if ((0 <= hue) && (hue < 60)) {
        r = max
        g = min+diff_div60*hue
        b = min        
    } else if ((60 <= hue) && (hue < 120)) {
        r = min+diff_div60*(120-hue)
        g = max
        b = min
    } else if ((120 <= hue) && (hue < 180)) {
        r = min
        g = max
        b = min+diff_div60*(hue-120)
    } else if ((180 <= hue) && (hue < 240)) {
        r = min
        g = min+diff_div60*(240-hue)
        b = max
    } else if ((240 <= hue) && (hue < 300)) {
        r = min+diff_div60*(hue-240)
        g = min
        b = max
    } else if ((300 <= hue) && (hue < 360)) {
        r = max
        g = min
        b = min + diff_div60*(360-H)
    }
    const rgbfloat = [r, g, b]
    return new RGB(rgbfloat.map(elm => (elm*255)|0))
}

// レイヤーを表示
function display(layer, hidden) {
    ctx[layer].canvas.style.visibility = "visible"
    ctx[hidden].canvas.style.visibility = "hidden"
    ctx[layer].timestamp = performance.now()
    ctx[hidden].complete = true
}

function nextfield(next, prev) {
    for (let i = 0; i < I; i++) {
    for (let j = 0; j < J; j++) {
        cell = field[prev][i][j]
        getneighbor(prev, i, j)
        aliveprev = isalive(cell)
        if (aliveprev) {
            alivenext
                = (cell[AL] <= neibcount) && (neibcount <= cell[AR])
            if (alivenext) {
                field[next][i][j][0] = cell[0]
                field[next][i][j][1] = cell[1]
                field[next][i][j][2] = cell[2]
                field[next][i][j][3] = cell[3]
            } else {
                field[next][i][j][0] = DEADGENE
            }
        } else {
            if (neibcount > 0) {
                breed()
                alivenext
                    = (child[BL] <= neibcount) && (neibcount <= child[BR])
                if (alivenext) {
                    field[next][i][j][0] = child[0]
                    field[next][i][j][1] = child[1]
                    field[next][i][j][2] = child[2]
                    field[next][i][j][3] = child[3]
                } else {
                    field[next][i][j][0] = DEADGENE
                }
            } else {
                field[next][i][j][0] = DEADGENE
            }

        }
    }}
    field[prev].used = true
    field[next].used = false
    field[next].converted = false
}

function getneighbor(layer, i, j) {
    neibcount = 0
    for (k = i-1; k <= i+1; k++) {

        if ((k < 0) || (I <= k)) continue
        for (l = j-1; l <= j+1; l++) {

            if ((l < 0) || (J <= l)) continue
            if ((k===i) && (l===j)) continue
            if (!isalive(field[layer][k][l])) continue

            neighbors[neibcount][0] = field[layer][k][l][0]
            neighbors[neibcount][1] = field[layer][k][l][1]
            neighbors[neibcount][2] = field[layer][k][l][2]
            neighbors[neibcount][3] = field[layer][k][l][3]

            neibcount++
        }
    }
}

function breed() {
    for (n = 0; n < CELLLEN; n++) {
        parent = neighbors[(Math.random()*neibcount)|0]
        child[n] = parent[n]
    }
}



function start(layer, behind) {
    if (field[layer].used && field[layer].converted) {
        console.time(`layer${layer}: nextfield`)
        nextfield(layer, behind)
        console.timeEnd(`layer${layer}: nextfield`)
    }
    
    if (!field[layer].converted && img[layer].drawn) {
        console.time(`layer${layer}: convertfield`)
        convertfield(layer)
        console.timeEnd(`layer${layer}: convertfield`)
    }
    
    if (!img[layer].drawn && ctx[layer].complete) {
        console.time(`layer${layer}: draw`)
        draw(layer)
        console.timeEnd(`layer${layer}: draw`)
    }

    if (!ctx[layer].complete
        && (ctx[layer].timestamp < ctx[behind].timestamp)
        && (performance.now() - ctx[behind].timestamp > period)) {
            console.time(`layer${layer}: display`)
            display(layer, behind)
            console.timeEnd(`layer${layer}: display`)
        }

    setTimeout(start, 1, layer, behind)
}