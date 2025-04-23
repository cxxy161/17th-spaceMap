

// 创建 Pixi 应用实例
const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0x100c2a,
    resolution: window.devicePixelRatio || 1,
    preference: 'webgl',
});
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.resize(window.innerWidth, window.innerHeight);

// 将 Pixi 应用的视图添加到游戏容器中
document.getElementById('game-container').appendChild(app.view);

// 创建地图层
/*
const mapLayer = new PIXI.ParticleContainer(10000, {
    scale: true,
    position: true,
    tint: true 
});*/
const mapLayer = new PIXI.Container();
app.stage.addChild(mapLayer);

// 创建UI层
const uiLayer = new PIXI.Container();
app.stage.addChild(uiLayer);

beload={}
addload=[]
