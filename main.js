

// 创建 Pixi 应用实例
// 方式2：直接初始化（更简洁）
export const app = new PIXI.Application({
    resizeTo: window,
    background: 0x100c2a,
    resolution: window.devicePixelRatio || 1,
    preference: 'webgl',
    autoDensity: true
});
await app.init()
app.renderer.resize(window.innerWidth, window.innerHeight);

//console.log(app);
app.canvas.style.position = "absolute";
app.canvas.style.display = "block";
document.getElementById('game-container').appendChild(app.canvas);
// 创建地图层
/*
const mapLayer = new PIXI.ParticleContainer(10000, {
    scale: true,
    position: true,
    tint: true 
});*/
export const mapLayer = new PIXI.Container();
app.stage.addChild(mapLayer);

// 创建UI层
const uiLayer = new PIXI.Container();
app.stage.addChild(uiLayer);

export const beload={}
export const addload=[]
 