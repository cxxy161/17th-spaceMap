

/*/ XY坐标转36进制ID（完整精度，安全编码）
export const xyToPosId = (x, y) => `${encodeNumber(x)}/${encodeNumber(y)}`;

// 35进制ID转XY坐标
export const posIdToXY = id => {
    const [x, y] = id.split('/').map(decodeNumber);
    return {x, y};
};

// 安全编码数字（整数和小数都转35进制）
const encodeNumber = n => {
    const sign = n < 0 ? 'N' : 'P';
    const str = Math.abs(n).toString();
    const [int, dec] = str.split('.');
    
    // 整数部分转35进制（D→X）
    const intEnc = parseInt(int || '0').toString(35)
                      .toUpperCase()
                      .replace(/D/g, 'X');
    
    // 小数部分处理
    const decEnc = dec ? 'D' + 
                   parseInt(dec.padEnd(15, '0').substring(0, 15), 10)
                      .toString(35)
                      .toUpperCase()
                      .replace(/D/g, 'X') : '';
    
    return sign + intEnc + decEnc;
};

// 安全解码数字
const decodeNumber = s => {
    const sign = s[0] === 'N' ? -1 : 1;
    const parts = s.slice(1).split('D');
    
    // 解码整数部分
    const int = parseInt(parts[0].replace(/X/g, 'D'), 35) || 0;
    
    // 解码小数部分
    const dec = parts[1] ? 
                parseInt(parts[1].replace(/X/g, 'D'), 35) / 
                Math.pow(10, parts[1].length) : 
                0;
    
    return sign * (int + dec);
};*/
// XY坐标转36进制ID（大写，无补位，'-'连接）
export const xyToPosId = (x, y) => `${numToB36(x)}-${numToB36(y)}`;

// 36进制ID转XY坐标
export const posIdToXY = id => id.split('-').map(b36ToNum).reduce((o, v, i) => (i ? o.y = v : o.x = v, o), {});

// 内部辅助函数
const numToB36 = n => (n < 0 ? 'N' : 'P') + Math.abs(n).toString(36).toUpperCase();
const b36ToNum = s => (s[0] === 'N' ? -1 : 1) * parseInt(s.slice(1).toLowerCase(), 36);

export function rand(seed, min = 0, max = 1, isFloat = false) {
    // 确保种子是整数
    seed=hash(seed);
    seed = Math.floor(seed);

    // Mulberry32算法 - 高质量的伪随机数生成
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    const randomValue = ((t ^ t >>> 14) >>> 0) / 4294967296;

    // 根据范围调整输出
    if (isFloat) {
        return randomValue * (max - min) + min;
    } else {
        return Math.floor(randomValue * (max - min + 1)) + min;
    }
}
export function randNormalCLT(seed, mean = 5000, stdDev = 5000, min = 1000, max = 31000) {
    // 将目标区间映射到[0,1]
    const range = max - min;
    const normalizedMean = (mean - min) / range;
    const normalizedStd = stdDev / range;

    // 计算Beta分布的α和β参数（近似正态形态）
    const alpha = normalizedMean * (normalizedMean*(1-normalizedMean)/(normalizedStd*normalizedStd) - 1);
    const beta = (1-normalizedMean) * (normalizedMean*(1-normalizedMean)/(normalizedStd*normalizedStd) - 1);

    // 用种子生成Beta分布随机数（简化版）
    const gamma1 = -Math.log(hash(seed) / 0xFFFFFFFF);
    const gamma2 = -Math.log(hash(seed + 1) / 0xFFFFFFFF);
    const betaValue = gamma1 / (gamma1 + gamma2);

    // 线性变换回原区间
    return min + betaValue * range;
}

export function hash(arr) {
    let hash = 0;

    for (let i = 0; i < arr.length; i++) {
        const str = String(arr[i]);
        for (let j = 0; j < str.length; j++) {
        hash = (hash * 31 + str.charCodeAt(j)) | 0; // 31是质数
        }
    }

    return Math.abs(hash);
}
/*
var color_temps = [
	[1000, [255, 128, 0]],
	[3700, [255, 191, 0]],
	[5200, [255, 255, 128]],
	[6000, [255, 255, 191]],
	[7500, [255, 255, 255]],
	[10000, [0, 128, 255]],
	[30000, [0, 0, 255]]
]
export function temperature_to_rgb(temp){
    if (temp <= color_temps[0][0]){
		return color_temps[0][1]
    }
	else if (temp >= color_temps[color_temps.length - 1][0]){
		return color_temps[color_temps.length - 1][1]
    }

	for (let i=0;i<color_temps.length - 1;i++){//i in range(color_temps.size() - 1)){
        if (color_temps[i][0] <= temp && temp <= color_temps[i + 1][0]){
			// 线性插值
			var t0 = color_temps[i][0]
			var r0 = color_temps[i][1][0]
			var g0 = color_temps[i][1][1]
			var b0 = color_temps[i][1][2]
			var t1 = color_temps[i + 1][0]
			var r1 = color_temps[i + 1][1][0]
			var g1 = color_temps[i + 1][1][1]
			var b1 = color_temps[i + 1][1][2]
			var t = (temp - t0) / (t1 - t0)
			var r = r0 + (r1 - r0) * t
			var g = g0 + (g1 - g0) * t
			var b = b0 + (b1 - b0) * t
			return rgbToHex([r, g, b])
        }
    }
		
}*/

function rgbToHex(rgbArray) {
    // 确保数组有3个元素且都是0-255的数字
    const [r, g, b] = rgbArray.map(val => Math.max(0, Math.min(255, val)));
    
    // 使用位操作组合成十六进制数
    return (r << 16) | (g << 8) | b;
  }

export class PerlinNoise2D {
    constructor() {
        this.gradients = new Map();
        this.memory = new Map();
    }

    // 改进的随机梯度生成
    _getGradient(x, y, seed) {
        const key = `${x}|${y}|${seed}`;
        if (this.gradients.has(key)) return this.gradients.get(key);

        // 更好的哈希函数
        let random = this._hash(x, y, seed);
        
        const angle = random * Math.PI * 2;
        const gradient = [Math.cos(angle), Math.sin(angle)];
        this.gradients.set(key, gradient);
        return gradient;
    }

    // 改进的哈希函数
    _hash(x, y, seed) {
        let h = Math.sin(x * 127.1 + y * 311.7 + seed * 437.3) * 458.5453123;
        return h - Math.floor(h);
    }

    // 点积计算
    _dotProductGrid(x, y, vx, vy, seed) {
        const g = this._getGradient(vx, vy, seed);
        const dx = x - vx;
        const dy = y - vy;
        return dx * g[0] + dy * g[1];
    }

    // 平滑插值
    _smoothInterpolate(a, b, w) {
        return (b - a) * (6 * w**5 - 15 * w**4 + 10 * w**3) + a;
    }

    // 获取噪声值
    get(x, y, seed = 0) {
        const cacheKey = `${x}|${y}|${seed}`;
        if (this.memory.has(cacheKey)) {
            return this.memory.get(cacheKey);
        }

        // 确定网格单元
        const x0 = Math.floor(x);
        const x1 = x0 + 1;
        const y0 = Math.floor(y);
        const y1 = y0 + 1;

        // 确定插值权重
        const sx = x - x0;
        const sy = y - y0;

        // 计算四个角点的点积
        const n0 = this._dotProductGrid(x, y, x0, y0, seed);
        const n1 = this._dotProductGrid(x, y, x1, y0, seed);
        const ix0 = this._smoothInterpolate(n0, n1, sx);

        const n2 = this._dotProductGrid(x, y, x0, y1, seed);
        const n3 = this._dotProductGrid(x, y, x1, y1, seed);
        const ix1 = this._smoothInterpolate(n2, n3, sx);

        const value = this._smoothInterpolate(ix0, ix1, sy);
        
        this.memory.set(cacheKey, value);
        return value;
    }

    clearCache() {
        this.gradients.clear();
        this.memory.clear();
    }
}