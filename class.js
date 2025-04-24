// 简化版柏林噪声实现
class PerlinNoise {
    constructor() {
      this.gradients = {};
      this.memory = {};
    }
  
    rand_vect() {
      let theta = Math.random() * 2 * Math.PI;
      return {x: Math.cos(theta), y: Math.sin(theta)};
    }
  
    dot_prod_grid(x, y, vx, vy) {
      let g_vect;
      let d_vect = {x: x - vx, y: y - vy};
      if (this.gradients[[vx,vy]]) {
        g_vect = this.gradients[[vx,vy]];
      } else {
        g_vect = this.rand_vect();
        this.gradients[[vx,vy]] = g_vect;
      }
      return d_vect.x * g_vect.x + d_vect.y * g_vect.y;
    }
  
    smootherstep(x) {
      return 6*x**5 - 15*x**4 + 10*x**3;
    }
  
    interp(x, a, b) {
      return a + this.smootherstep(x) * (b-a);
    }
  
    perlin(x, y) {
      if (this.memory[[x,y]]) return this.memory[[x,y]];
      
      let xf = Math.floor(x);
      let yf = Math.floor(y);
      
      // 获取四个角落的点积
      let tl = this.dot_prod_grid(x, y, xf,   yf);
      let tr = this.dot_prod_grid(x, y, xf+1, yf);
      let bl = this.dot_prod_grid(x, y, xf,   yf+1);
      let br = this.dot_prod_grid(x, y, xf+1, yf+1);
      
      // 插值
      let xt = this.interp(x-xf, tl, tr);
      let xb = this.interp(x-xf, bl, br);
      let v = this.interp(y-yf, xt, xb);
      
      this.memory[[x,y]] = v;
      return v;
    }
  }
  

function rand(seed, min = 0, max = 1, isFloat = false) {
    // 确保种子是整数
    seed=arrayToDecimalHash(seed);
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

function arrayToDecimalHash(arr) {
    let hash = 0;

    for (let i = 0; i < arr.length; i++) {
        const str = String(arr[i]);
        for (let j = 0; j < str.length; j++) {
        hash = (hash * 31 + str.charCodeAt(j)) | 0; // 31是质数
        }
    }

    return Math.abs(hash);
}

var color_temps = [
	[1000, [255, 128, 0]],
	[3700, [255, 191, 0]],
	[5200, [255, 255, 128]],
	[6000, [255, 255, 191]],
	[7500, [255, 255, 255]],
	[10000, [0, 128, 255]],
	[30000, [0, 0, 255]]
]
function temperature_to_rgb(temp){
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
		
}

function rgbToHex(rgbArray) {
    // 确保数组有3个元素且都是0-255的数字
    const [r, g, b] = rgbArray.map(val => Math.max(0, Math.min(255, val)));
    
    // 使用位操作组合成十六进制数
    return (r << 16) | (g << 8) | b;
  }