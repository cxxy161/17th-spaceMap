//import {noise} from './perlin.js';
//var noise=require('perlin.js')
//type="module" 
import { hash, rand, PerlinNoise2D, randNormalCLT } from './class.js';
import { xyToPosId } from './class.js';
import { datalist } from './main.js';

function classifyStarWithColor(age, temperature, radius, mass) {
    // ------ 1. 恒星分类逻辑（修正版） ------
    let spectralType;
    if (temperature >= 30000) spectralType = "O型";
    else if (temperature >= 10000) spectralType = "B型";
    else if (temperature >= 7500) spectralType = "A型";
    else if (temperature >= 6000) spectralType = "F型";
    else if (temperature >= 5200) spectralType = "G型";
    else if (temperature >= 3700) spectralType = "K型";
    else spectralType = "M型";

    const mainSequenceLifetime = 1e2 * Math.pow(mass, -2.5);
    let evolutionaryStage;
    let isBlueGiant = false;

    // 判断演化阶段（区分蓝巨星/红巨星）
    if (mass < 8) {
        if (age < mainSequenceLifetime) evolutionaryStage = "主序星";
        else if (age < 1.2 * mainSequenceLifetime) evolutionaryStage = "红巨星";
        else evolutionaryStage = "白矮星";
    } else {
        if (age < mainSequenceLifetime) {
            evolutionaryStage = "主序星";
        } else {
            // 大质量恒星：根据温度和半径区分蓝巨星/红超巨星
            if (temperature > 8000 && radius < 100) {
                evolutionaryStage = "蓝巨星";
                isBlueGiant = true;
            } else {
                evolutionaryStage = "红超巨星";
            }
        }
    }

    // 白矮星半径检查
    if (evolutionaryStage === "白矮星" && radius > 0.02) evolutionaryStage = "红巨星";
    const starType = `${spectralType}${evolutionaryStage}`;

    // ------ 2. 颜色计算（修正版） ------
    // (a) 优先根据演化阶段覆盖颜色（如红巨星强制红色）
    let colorName, bv;
    if (evolutionaryStage.includes("红巨星") || evolutionaryStage.includes("红超巨星")) {
        colorName = "深红色";
        bv = 1.5; // 红巨星的B-V通常 > 1.5
    } else if (isBlueGiant) {
        colorName = "亮蓝色";
        bv = -0.2; // 蓝巨星的B-V < 0
    } else {
        // 其他情况按温度计算
        bv = 4600 / temperature - 0.5;
        if (bv < -0.3) colorName = "蓝白色";
        else if (bv < 0.0) colorName = "蓝白色";
        else if (bv < 0.3) colorName = "白色";
        else if (bv < 0.6) colorName = "黄白色";
        else if (bv < 1.0) colorName = "黄色";
        else if (bv < 1.5) colorName = "橙红色";
        else colorName = "深红色";
    }

    // (b) 计算RGB（若为红巨星/红超巨星，覆盖为红色）
    let rgb;
    if (evolutionaryStage.includes("红")) {
        rgb = "rgb(255, 49, 22)"; // 橙红色
    } else if (isBlueGiant) {
        rgb = "rgb(188, 220, 253)"; // 亮蓝色
    } else {
        rgb = temperatureToRGB(temperature);
    }

    return {
        type: starType,
        color: { rgb: rgb, name: colorName },
        bv: parseFloat(bv.toFixed(2)),
    };
}
function temperatureToRGB(temp) {
    let r, g, b;
    temp = temp / 1000; // 转换为千开尔文

    // 分段计算RGB（基于黑体辐射色温拟合）
    if (temp <= 6.6) {
        r = 255;
        g = Math.max(0, Math.min(255, 99.47 * Math.log(temp) - 161.1));
        b = 0;
    } else if (temp <= 20) {
        r = 255;
        g = Math.max(0, Math.min(255, 138.51 * Math.log(temp - 6) + 58.7));
        b = 0;
    } else {
        r = Math.max(0, Math.min(255, 329.7 * Math.pow(temp - 20, -0.133)));
        g = Math.max(0, Math.min(255, 288.1 * Math.pow(temp - 20, -0.075)));
        b = 255;
    }

    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}
function getstarcolor(type, tem) {

}

function generateAtmosphere(planetType, mass, orbitRadius, starType = "G") {
    // 定义各行星类型的大气成分可能性
    const atmosphereTemplates = {
        // 类地行星（岩石，可能含CO2/N2/O2）
        "类地行星": {
            possibleGases: ["CO2", "N2", "O2", "H2O", "SO2", "Ar"],
            constraints: {
                CO2: { min: 0, max: 96 }, // 金星CO2占96%
                N2: { min: 0, max: 78 },  // 地球N2占78%
                O2: { min: 0, max: 21 },  // 地球O2占21%
                H2O: { min: 0, max: 5 },  // 水蒸气（可变）
                SO2: { min: 0, max: 0.1 }, // 火山气体
                Ar: { min: 0, max: 2 }    // 惰性气体
            },
            // 质量>0.5地球才可能保留大气
            requireMinimumMass: 0.5,
            // 轨道太近（<0.5AU）可能失去大气
            loseAtmosphereIfTooClose: 0.5
        },
        // 超级地球（可能厚H2O/CO2或H2/He）
        "超级地球": {
            possibleGases: ["CO2", "N2", "H2O", "H2", "He", "CH4"],
            constraints: {
                CO2: { min: 0, max: 50 },
                N2: { min: 0, max: 30 },
                H2O: { min: 0, max: 40 }, // 海洋行星可能高H2O
                H2: { min: 0, max: 20 },  // 迷你海王星特征
                He: { min: 0, max: 10 },
                CH4: { min: 0, max: 5 }
            },
            // 质量>2地球可能保留H2/He
            hydrogenRichIfMassOver: 2
        },
        // 气态巨行星（H2/He主导）
        "气态巨星": {
            possibleGases: ["H2", "He", "CH4", "NH3", "H2O", "CO"],
            constraints: {
                H2: { min: 75, max: 95 },  // 主要成分
                He: { min: 5, max: 25 },
                CH4: { min: 0, max: 2 },   // 低温下CH4增多
                NH3: { min: 0, max: 1 },
                H2O: { min: 0, max: 1 },
                CO: { min: 0, max: 0.5 }   // 高温下CO增多
            },
            // 热木星（<0.1AU）可能含金属氧化物
            hotJupiterAdditions: {
                gases: ["TiO", "VO"],
                maxPercent: 0.1
            }
        },
        // 冰巨星（H2O/CH4/NH3混合）
        "冰巨星": {
            possibleGases: ["H2", "He", "CH4", "H2O", "NH3", "H2S"],
            constraints: {
                H2: { min: 60, max: 80 },
                He: { min: 10, max: 20 },
                CH4: { min: 1, max: 5 },  // 天王星/海王星CH4占1-2%
                H2O: { min: 0, max: 3 },
                NH3: { min: 0, max: 2 },
                H2S: { min: 0, max: 1 }
            }
        }
    };

    // 检查行星类型是否有效
    if (!atmosphereTemplates[planetType]) {
        throw new Error(`未知的行星类型: ${planetType}`);
    }

    const template = atmosphereTemplates[planetType];
    const atmosphere = {};

    // --- 特殊规则覆盖 ---
    // 1. 类地行星质量过低或轨道太近则无大气
    if (planetType === "类地行星") {
        if (mass < template.requireMinimumMass || orbitRadius < template.loseAtmosphereIfTooClose) {
            return { "No atmosphere": 100 }; // 返回无大气
        }
    }

    // 2. 超级地球质量较大时可能含H2/He（迷你海王星）
    if (planetType === "超级地球" && mass > template.hydrogenRichIfMassOver) {
        template.constraints.H2.max = 50; // 提高H2上限
        template.constraints.He.max = 20;
    }

    // 3. 热木星（气态巨行星且轨道<0.1AU）添加金属氧化物
    if (planetType === "气态巨星" && orbitRadius < 0.1 && template.hotJupiterAdditions) {
        template.possibleGases.push(...template.hotJupiterAdditions.gases);
        template.constraints.TiO = { min: 0, max: template.hotJupiterAdditions.maxPercent };
        template.constraints.VO = { min: 0, max: template.hotJupiterAdditions.maxPercent };
    }

    // --- 随机生成各气体百分比 ---
    let remainingPercent = 100;
    const gases = [...template.possibleGases];

    // 随机打乱气体顺序，避免总是优先分配某些成分
    gases.sort(() => rand([planetType, mass, orbitRadius, 1], 0, 1, true) - 0.5);

    for (let i = 0; i < gases.length; i++) {
        const gas = gases[i];
        const { min, max } = template.constraints[gas] || { min: 0, max: 0 };

        if (remainingPercent <= 0) break;

        // 计算当前气体的可能范围
        const currentMax = Math.min(max, remainingPercent);
        let percent = 0;

        if (currentMax > min) {
            percent = rand([planetType, mass, orbitRadius, 2], 0, 1, true) * (currentMax - min) + min;
            percent = getfloor(percent); // 保留两位小数
            remainingPercent -= percent;
        }

        if (percent > 0) {
            atmosphere[gas] = percent;
        }
    }

    // 如果剩余百分比未分配完，分配给主要成分
    if (remainingPercent > 0) {
        const mainGas = template.possibleGases[0]; // 第一个气体通常是主要成分
        atmosphere[mainGas] = (atmosphere[mainGas] || 0) + getfloor(remainingPercent);
    }

    return atmosphere;
}

function getPlanetColor(atmosphere) {
    // 默认颜色（无大气或未知）
    let color = { r: 100, g: 100, b: 100 }; // 灰色

    // 颜色贡献规则
    const colorRules = {
        H2: { r: 0, g: 50, b: 200 },   // 深蓝
        He: { r: 0, g: 100, b: 150 },   // 蓝绿
        CH4: { r: 0, g: 150, b: 100 },  // 蓝绿（甲烷主导）
        CO2: { r: 200, g: 200, b: 100 },// 淡黄（高CO2）
        H2O: { r: 180, g: 220, b: 255 },// 淡蓝（水云）
        N2: { r: 150, g: 150, b: 200 }, // 浅蓝（地球式）
        SO2: { r: 240, g: 230, b: 100 },// 淡黄（硫酸云）
        TiO: { r: 50, g: 50, b: 50 },   // 暗灰
        VO: { r: 70, g: 40, b: 40 },    // 红灰
        H2S: { r: 160, g: 120, b: 60 } // 棕黄
    };

    // 加权混合颜色
    let total = 0;
    let mixed = { r: 0, g: 0, b: 0 };

    for (const gas in atmosphere) {
        if (colorRules[gas] && atmosphere[gas] > 0) {
            const percent = atmosphere[gas] / 100;
            mixed.r += colorRules[gas].r * percent;
            mixed.g += colorRules[gas].g * percent;
            mixed.b += colorRules[gas].b * percent;
            total += percent;
        }
    }

    // 归一化并处理无数据情况
    if (total > 0) {
        color.r = Math.round(mixed.r / total);
        color.g = Math.round(mixed.g / total);
        color.b = Math.round(mixed.b / total);
    }

    // 转换为CSS颜色
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function generatePlanetOrbits(starMass, minAU = 0.1, maxAU = 30, planetCount = 5, id) {
    const orbits = [];
    const pj = (minAU + maxAU) / planetCount
    /*/ 生成幂律分布的初始候选轨道（范围[minAU, maxAU]）
    for (let i = 0; i < planetCount; i++) {
        // 生成[0,1)均匀随机数，转换为幂律分布（指数-1.5）
        const u = rand([id,i],0,1,true);
        const powerLawValue = Math.pow(u, -1 / 1.5);
        
        // 将幂律值映射到[minAU, maxAU]范围（需归一化）
        const a = minAU + (maxAU - minAU) * (1 - Math.pow(powerLawValue, -2/3)); // 修正映射公式
        orbits.push(Math.floor(a*100)/100);
    }*/
    for (let i = 1; i < planetCount + 1; i++) {

        const he = getfloor(rand([id, i], pj * i * 0.5, pj * i * 1.5, true))
        orbits.push(he)
    }
    return orbits.sort((a, b) => a - b);
}
function creat_star(bx, by, x, y, i) {
    //let x = Math.floor(bx*500 + rand([bx,by,i,1],0,500))
    //let y = Math.floor(by*500 + rand([bx,by,i,2],0,500))
    let sx = Math.floor(bx * 500 + x)
    let sy = Math.floor(by * 500 + y)
    let temp = getfloor(randNormalCLT([sx, sy, i, 3], 3500, 20000, 1000, 40000))
    //let temp=rand([sx,sy,i,3],1000,40000)
    let mass = getfloor(randNormalCLT([sx, sy, i, 4], 0.5, 8, 0.08, 100))//倍太阳质量
    //let mass=randNormalCLT([sx,sy,i,4],0.5,0.8,0.08,100)//倍太阳质量
    let age = getfloor(randNormalCLT([sx, sy, i, 5], 5, 30, 0, 138))//亿年
    //let radius=randNormalCLT([sx,sy,i,6],0.8,1.5,0.01,1000)//倍太阳半径
    let radius;
    if (mass < 8) {
        radius = getfloor(Math.pow(mass, 0.8)); // 主序星半径-质量关系
    } else {
        radius = getfloor(10 * Math.pow(mass, 0.5)); // 大质量星或巨星简化模型
    }
    let data = classifyStarWithColor(age, temp, radius, mass)
    let type = data.type
    let color = data.color.rgb
    let posid = xyToPosId(sx, sy)

    let planetnum = Math.max(rand([sx, sy, i, 6], 0, 18) - 10, 0)
    let planetminau = rand([sx, sy, i, 7], 0, 2)
    let planetmaxau = rand([sx, sy, i, 8], 3, 30)
    let planetorbits = generatePlanetOrbits(mass, planetminau, planetmaxau, planetnum, posid)

    return {
        'x': sx,
        'y': sy,
        'index': i,
        'posid': posid,
        'temp': temp,
        'mass': mass,
        'age': age,
        'radius': radius,
        'type': type,
        'color': color,
        'planets': planetorbits,
        //'num':[planetnum,planetminau,planetmaxau,rand([sx,sy,i,6],0,18) ]
    }
}

const planet_type = {
    '类地行星': {
        'rou': [4, 5.5],
        'rad': [0.5, 1.5],
        'mass': [0.1, 10]
    },
    '超级地球': {
        'rou': [2, 5],
        'rad': [1.5, 2.5],
        'mass': [5, 10]
    },
    '冰巨星': {
        'rou': [1, 2],
        'rad': [3, 5],
        'mass': [10, 50]
    },
    '气态巨星': {
        'rou': [0.5, 1.5],
        'rad': [5, 12],
        'mass': [50, 1000]
    },
}
const maybe_planet_air = ['n2', 'o2', 'h2o', 'co2', 'ch4', 'nh3', 'o3']

function getfloor(num) {
    return Math.floor(num * 100) / 100
}

export function creat_planet(stid, heigh, st) {
    let numid = hash([stid, heigh])
    let type = Object.keys(planet_type)[Math.floor(rand([numid, 1], 0, 3))]
    let mass = rand([numid, 2], planet_type[type].mass[0], planet_type[type].mass[1], true)//倍地球质量
    let radius = rand([numid, 3], planet_type[type].rad[0], planet_type[type].rad[1], true)//倍地球半径
    let rou = mass / radius ** 3 * 4//平均密度
    let g = 9.81 * (mass / (radius) ** 2)//重力加速度

    let jizuobiao = rand([stid, heigh, 11], -Math.PI, Math.PI, true)

    let air = generateAtmosphere(type, mass, heigh)
    let color = getPlanetColor(air)

    return {
        'mass': getfloor(mass),
        'radius': getfloor(radius),
        'anglepos': getfloor(jizuobiao),
        'heigh': getfloor(heigh),
        'rou': getfloor(rou),
        'g': getfloor(g),
        'type': type,
        'air': air,
        'color': color,
    }
}



let bloseed = hash(['block'])
let noise = new PerlinNoise2D()
export function getblock(x, y) {
    let stardata = []
    let bx = x//Math.ceil(x/500);
    let by = y//Math.ceil(y/500);
    /*let n=(noise.get(bx/100,by/100,bloseed+10)+1)*5
    for(let i=0;i<n;i++){
        let r=Math.max(0,noise.get(bx/20,by/20,bloseed+i+11))/10
        let st=noise.get(bx*r,by*r,bloseed+i+11)
        console.log(st,r,n,bx,by,x,y)
        if(st>0){
            stardata.push(creat_star(x,y,i));
        }
    }*/
    let i = 0
    let nx = Math.floor(rand([bx, by, i, 1], 0, 500))
    let ny = Math.floor(rand([bx, by, i, 2], 0, 500))
    let molist = [[nx, ny]]
    let starlists = []
    while (molist.length) {
        let idx = Math.floor(rand([x, y, i], 0, molist.length - 1))
        let ths = molist[idx]
        let r = Math.floor((-(noise.get(ths[0] / 20, ths[1] / 20, bloseed + i)) + 1) * 100)
        //console.log(r)
        let found = false
        for (let j = 0; j < 200; j++) {
            let theta = rand([x, y, i, j, 1], 0, 2 * Math.PI)
            let ra = rand([x, y, i, j, 2], 0, r)
            let npos = [ths[0] + ra * Math.cos(theta), ths[1] + ra * Math.sin(theta)]
            if (npos[0] < 0 || npos[1] < 0 || npos[0] > 500 || npos[1] > 500) {
                continue
            }
            let vear = false
            //if(starlists.length<2){vear=true}
            for (let mo of starlists) {
                let distance = Math.sqrt((mo[0] - npos[0]) ** 2 + (mo[1] - npos[1]) ** 2)
                if ((distance < r)) {
                    //console.log('too close',distance,r)
                    vear = true
                    break
                }
            }
            if (!vear) {
                molist.push(npos)
                starlists.push(npos)
                found = true
                break
            }
        }

        if (!found) {
            molist.splice(idx, 1)
            //console.log('remove',idx)
        }

        i++
        if (i > 1000) {
            console.log('too many loop')
            break
        }
    }
    for (let st of starlists) {
        let dyata = null
        //console.log(st.posid,datalist,st.posid in datalist)
        if (st.posid in datalist) { dyata = datalist[st.posid] }
        let geshi = {
            star: creat_star(x, y, st[0], st[1], i),
            data: null,
            planet: []
        }
        stardata.push(geshi);
    }
    //console.log(starlists)
    return stardata;
}


export function savedata(st, data) {
    st.data = data
    datalist[st.star.posid] = data
}