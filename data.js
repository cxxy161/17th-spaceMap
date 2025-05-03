//import {noise} from './perlin.js';
//var noise=require('perlin.js')
//type="module" 
import {hash,rand,PerlinNoise2D,randNormalCLT} from './class.js';
import {xyToPosId} from './class.js';
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
        rgb = "rgb(255, 100, 0)"; // 橙红色
    } else if (isBlueGiant) {
        rgb = "rgb(150, 200, 255)"; // 亮蓝色
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

function generatePlanetOrbits(starMass, minAU = 0.1, maxAU = 30, planetCount = 5,id) {
    const orbits = [];
    
    // 生成幂律分布的初始候选轨道（范围[minAU, maxAU]）
    for (let i = 0; i < planetCount; i++) {
        // 生成[0,1)均匀随机数，转换为幂律分布（指数-1.5）
        const u = rand([id,i],0,1,true);
        const powerLawValue = Math.pow(u, -1 / 1.5);
        
        // 将幂律值映射到[minAU, maxAU]范围（需归一化）
        const a = minAU + (maxAU - minAU) * (1 - Math.pow(powerLawValue, -2/3)); // 修正映射公式
        orbits.push(Math.floor(a*100)/100);
    }
    
    // 按轨道距离排序
    return orbits.sort((a, b) => a - b);
}
function creat_star(bx,by,x,y,i){
    //let x = Math.floor(bx*500 + rand([bx,by,i,1],0,500))
    //let y = Math.floor(by*500 + rand([bx,by,i,2],0,500))
    let sx = Math.floor(bx*500+x)
    let sy = Math.floor(by*500+y)
    let temp=randNormalCLT([sx,sy,i,3],3500,20000,1000,40000)
    //let temp=rand([sx,sy,i,3],1000,40000)
    let mass=randNormalCLT([sx,sy,i,4],0.5,8,0.08,100)//倍太阳质量
    //let mass=randNormalCLT([sx,sy,i,4],0.5,0.8,0.08,100)//倍太阳质量
    let age=randNormalCLT([sx,sy,i,5],5,30,0,138)//亿年
    //let radius=randNormalCLT([sx,sy,i,6],0.8,1.5,0.01,1000)//倍太阳半径
    let radius;
    if (mass < 8) {
    radius = Math.pow(mass, 0.8); // 主序星半径-质量关系
    } else {
    radius = 10 * Math.pow(mass, 0.5); // 大质量星或巨星简化模型
    }
    let data=classifyStarWithColor(age,temp,radius,mass)
    let type=data.type
    let color=data.color.rgb
    let posid = xyToPosId(sx, sy)

    let planetnum=Math.max(rand([sx,sy,i,6],0,18)-10,0)
    let planetminau=rand([sx,sy,i,7],0,2)
    let planetmaxau=rand([sx,sy,i,8],3,30)
    let planetorbits=generatePlanetOrbits(mass,planetminau,planetmaxau,planetnum,posid)

    return {
        'x':sx,
        'y':sy,
        'index':i,
        'posid':posid,
        'temp':temp,
        'mass':mass,
        'age':age,
        'radius':radius,
        'type':type,
        'color':color,
        'planets':planetorbits,
        //'num':[planetnum,planetminau,planetmaxau,rand([sx,sy,i,6],0,18) ]
    }
}

const planet_type={
    '类地行星':{
        'rou':[4,5.5],
        'rad':[0.5,1.5],
        'mass':[0.1,10]
    },
    '超级地球':{
        'rou':[2,5],
        'rad':[1.5,2.5],
        'mass':[5,10]
    },
    '冰巨星':{
        'rou':[1,2],
        'rad':[3,5],
        'mass':[10,50]
    },
    '气态巨星':{
        'rou':[0.5,1.5],
        'rad':[5,12],
        'mass':[50,3000]
    },
}
const maybe_planet_air=['n2','o2','h2o','co2','ch4','nh3']


export function creat_planet(stid,heigh,st){
    let numid=hash([stid,heigh])
    let type=Object.keys(planet_type)[Math.floor(rand([numid,1],0,3))]
    let mass=rand([numid,2],planet_type[type].mass[0],planet_type[type].mass[1])//倍地球质量
    let radius=rand([numid,3],planet_type[type].rad[0],planet_type[type].rad[1])//倍地球半径
    let rou=mass/radius**3*4//平均密度
    let g=6.674e-11*mass/(radius**2)//重力加速度


    return {
        'mass':mass,
        'radius':radius,
        'rou':rou,
        'g':g,
        'type':type,
        
    }
}



let bloseed=hash(['block'])
let noise=new PerlinNoise2D()
export function getblock(x, y) {
    let stardata=[]
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
    let i=0
    let nx = Math.floor(rand([bx,by,i,1],0,500))
    let ny = Math.floor(rand([bx,by,i,2],0,500))
    let molist=[[nx,ny]]
    let starlists=[]
    while(molist.length){
        let idx=Math.floor(rand([x,y,i],0,molist.length-1))
        let ths=molist[idx]
        let r=Math.floor((-(noise.get(ths[0]/20,ths[1]/20,bloseed+i))+1)*100)
        //console.log(r)
        let found=false
        for(let j=0;j<200;j++){
            let theta=rand([x,y,i,j,1],0,2*Math.PI)
            let ra=rand([x,y,i,j,2],0,r)
            let npos=[ths[0]+ra*Math.cos(theta),ths[1]+ra*Math.sin(theta)]
            if(npos[0]<0||npos[1]<0||npos[0]>500||npos[1]>500){
                continue
            }
            let vear=false
            //if(starlists.length<2){vear=true}
            for(let mo of starlists){
                let distance=Math.sqrt((mo[0]-npos[0])**2+(mo[1]-npos[1])**2)
                if((distance<r)){
                    //console.log('too close',distance,r)
                    vear=true
                    break
                }
            }
            if(!vear){
                molist.push(npos)
                starlists.push(npos)
                found=true
                break
            }
        }

        if(!found){
            molist.splice(idx,1)
            //console.log('remove',idx)
        }

        i++
        if(i>1000){
            console.log('too many loop')
            break
        }
    }
    for(let st of starlists){
        let dyata=null
        //console.log(st.posid,datalist,st.posid in datalist)
        if(st.posid in datalist){dyata=datalist[st.posid]}
        let geshi={
            star:creat_star(x,y,st[0],st[1],i),
            data:null,
            planet:null
        }
        stardata.push(geshi);
    }
    //console.log(starlists)
    return stardata;
}


export function savedata(st,data){
    st.data=data
    datalist[st.star.posid]=data
}