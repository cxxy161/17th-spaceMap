import { app,mapLayer,beload,addload } from "./main.js";
import { getblock } from "./data.js";
//import { temperature_to_rgb } from "./class.js";

/*let whiteTexture; // 声明一个变量来存储白色纹理

function init_textures() {
    whiteTexture = PIXI.Texture.WHITE; // 将白色纹理赋值给全局变量
    const sprite = new PIXI.Sprite(whiteTexture);
    sprite.tint = 0x00FF00; // 绿色
    sprite.width = sprite.height = 50; // 宽高相同
    sprite.anchor.set(0.5); // 中心锚点
    app.stage.addChild(sprite);
    sprite.position.set(200, 200);
    return sprite;
}*/

// 在地图层中绘制一个简单的图形，例如一个绿色的矩形
//const mapRectangle = new PIXI.Graphics();
//mapRectangle.beginFill(0x00ff00);
//mapRectangle.drawRect(50, 50, 200, 200);
//mapRectangle.endFill();
//mapLayer.addChild(mapRectangle);

// 在UI层中绘制一个简单的图形，例如一个红色的矩形
//const uiRectangle = new PIXI.Graphics();
//uiRectangle.beginFill(0xff0000);
//uiRectangle.drawRect(300, 300, 100, 100);
//uiRectangle.endFill();
//uiLayer.addChild(uiRectangle);

function rend_line(x,y){
    let rectangle = new PIXI.Graphics();

    rectangle.lineStyle(2, 0xFF0000, 1) // 线条宽度为2，颜色为红色，alpha为1
            .drawRect(x*500,y*500,500,500);

    mapLayer.addChild(rectangle);
}

//let star_fill=
function rend_block(list,bx,by){
    var rendstargroup = new PIXI.Graphics();
    beload[[bx,by]].rend=rendstargroup
    //rendstargroup.fill()
    for(let i=0;i<list.length;i++){
        let x=list[i].star.x
        let y=list[i].star.y

        rend_star(x,y,rendstargroup,list[i].star);
    }
    rendstargroup.endFill();
    mapLayer.addChild(rendstargroup);
}

function rend_star(x,y,star,obj){
    
    star.fill(obj.color);
    star.circle(x,y,5);
    
    
}
    
   /*
function rend_block(list) {
    for (let i = 0, len = list.length; i < len; i++) {
        const { x, y } = list[i];
        rend_star(x, y);
    }
}

function rend_star(x, y) {
    const star = new PIXI.Sprite(PIXI.Texture.WHITE); // 改用 Sprite（ParticleContainer 不支持 Graphics）
    star.tint = 0xffffff;
    star.width = star.height = 10; // 圆形直径 = 5*2
    star.anchor.set(0.5);
    star.position.set(x, y);
    mapLayer.addChild(star);
}*/
var old_view_scxy=[0,0,0,0];
const areEqual = (a, b) => 
    a.length === b.length && 
    a.every((item, index) => item === b[index]);

export function check_new_bolck(){
    // 检查是否有新的块需要绘制
    // 计算缩放后的实际屏幕宽度和高度（世界 坐标）
    const scaledScreenWidth = app.screen.width / mapLayer.scale.x;
    const scaledScreenHeight = app.screen.height / mapLayer.scale.y;

    // 计算基准单位（假设 500 是 tile 大小）
    const tileSize = 500;

    // 计算左上角 (xs, ys)
    let xs = -Math.ceil((mapLayer.x / tileSize) / mapLayer.scale.y) -1//- 1;
    let ys = -Math.ceil((mapLayer.y / tileSize) / mapLayer.scale.y) -1//- 1;

    // 计算右下角 (xe, ye)，考虑缩放后的屏幕范围
    let xe = Math.ceil((-mapLayer.x + scaledScreenWidth) / tileSize / mapLayer.scale.x) +1//+ 1;
    let ye = Math.ceil((-mapLayer.y + scaledScreenHeight) / tileSize / mapLayer.scale.y)+1//+ 1;
    /*
    let xs=-Math.ceil(-(mapLayer.x / 500) / mapLayer.scale.y) - 1;
    let ys=-Math.ceil(-(mapLayer.y / 500) / mapLayer.scale.y) - 1;
    let xe=Math.ceil()
*/
    if(areEqual([xs,ys,xe,ye],old_view_scxy)){
        check_old_bolck(old_view_scxy)
        return
    }
    //console.log([xs,ys,xe,ye],xs-xe,ys-ye)
    //console.log("check_new_bolck",xs,ys,xe,ye,mapLayer.scale.x,mapLayer.scale.y);
    for (let i = Math.min(xs, xe); i < Math.max(xs, xe); i++) {
        for (let j = Math.min(ys, ye); j < Math.max(ys, ye); j++) {
            if(!([i,j] in beload)){
                if(!([i,j] in addload)){
                    //getblock(i,j);
                    addload.push([i,j]);
                    //console.log("addload",addload);
                }
            }
        }
    }
    old_view_scxy=[xs,ys,xe,ye]
    check_old_bolck(old_view_scxy)
    //rend_bolcks();
}
function check_old_bolck(view){
    for (let sti of Object.keys(beload)){
        let st=sti.split(",").map(Number);
        //let st=beload[sti]
        //console.log(st,sti,view);
        if(st[0]<view[0]-7||st[0]>=view[2]+7||st[1]<view[1]-7||st[1]>=view[3]+7){
            //console.log("remove",st[0],st[1]);
            let rend=beload[st].rend
            mapLayer.removeChild(rend);
            delete beload[st];
        }
    }
}


function rend_bolcks(){
    // 渲染块
    if(addload.length==0){return}
    const time=Date.now();
    for(let i=0;i<addload.length;i++){
        let [x,y]=addload[i];
        if([x,y] in beload){
            addload.splice(i,1);
            continue
        }
        let block=getblock(x,y);
        beload[[x,y]]={block:block,rend:null};
        //const time2=Date.now(); 
        //rend_line(x,y);
        rend_block(block,x,y);  
        //console.log("rend_line",Date.now()-time2,block);
        addload.splice(i,1);
        if(Date.now()-time>16){
            //console.log('overtime')
            break}

        //console.log("rend_bolck",x,y,block);
    }
    console.log("rend_bolcks",Date.now()-time,addload.length,Object.keys(beload).length);

    //addload=[];
}
//console.log(window.app);
app.ticker.add(() => {rend_bolcks();});

//init_textures(); // 初始化纹理
//PIXI.Texture.WHITE = whiteTexture; 
check_new_bolck();