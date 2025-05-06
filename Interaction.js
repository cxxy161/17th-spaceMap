import { app,beload,mapLayer,planetLayer} from "./main.js";
import { check_new_bolck, rend_planet } from "./rend.js";
import { chose_star,close_planet } from "./html_inter.js";

app.stage.interactive = true;
app.stage.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);
//mapLayer.buttonMode = true;
//app.stage.eventMode = 'dynamic';
// 变量用于存储鼠标按下时的位置
let dragStart = { x: 0, y: 0 };
let initialDistance = null;
let initialScale = 1;
let initialPosition = { x: 0, y: 0 };
let pointerStartTime = 0;
let pointerStartPosition = { x: 0, y: 0 };
let isDragging = false;

// 修改事件监听器
app.stage.on('pointerdown', (event) => {
    const touches = getTouches(event);
    if (touches && touches.length >= 2) {
        onPinchStart(event);
    } else {
        pointerStartTime = Date.now();
        pointerStartPosition.x = event.data.global.x;
        pointerStartPosition.y = event.data.global.y;
        isDragging = false;
        onDragStart(event);
    }
})
.on('pointermove', (event) => {
    const touches = getTouches(event);
    if (touches && touches.length >= 2) {
        onPinchMove(event);
    } else {
        // 检查是否开始拖动
        const dx = event.data.global.x - pointerStartPosition.x;
        const dy = event.data.global.y - pointerStartPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 如果移动距离超过阈值，认为是拖动
        if (distance > 10) {
            isDragging = true;
        }
        
        onDragMove(event);
    }
})
.on('pointerup', (event) => {
    const touches = getTouches(event);
    if (!touches || touches.length < 2) {
        onDragEnd();
        initialDistance = null;
        
        // 如果不是拖动，则处理为点击
        if (!isDragging) {
            const pointerEndTime = Date.now();
            const pointerDuration = pointerEndTime - pointerStartTime;
            
            // 确保是短时间的点击（小于300ms）
            if (pointerDuration < 300) {
                handleClick(event);
            }
        }
    }
})
.on('pointerupoutside', onDragEnd)
.on('wheel', onWheel);

// 添加 which 函数定义
function which() {
    if (now_view === 'map') {
        return mapLayer;
    } else if (now_view === 'planet') {
        return planetLayer;
    }
    return mapLayer; // 默认返回 mapLayer
}

// 修改拖动相关函数
function onDragStart(event) {
    let layer = which();
    layer.dragging = true;
    dragStart.x = event.data.global.x - layer.x;
    dragStart.y = event.data.global.y - layer.y;
}

function onDragEnd() {
    let layer = which();
    layer.dragging = false;
    isDragging = false;
}

function onDragMove(event) {
    let layer = which();
    if (layer.dragging) {
        layer.x = event.data.global.x - dragStart.x;
        layer.y = event.data.global.y - dragStart.y;
        layer.lastdrag = Date.now();
        check_new_bolck();
    }
}

function onWheel(event) {
    event.preventDefault(); // 防止页面滚动
    let layer=which();

    const scaleFactor = 1.2; // 缩放因子（1.2 表示每次缩放 20%）
    const mousePosition = event.data.global; // 鼠标在全局坐标系的位置

    // 计算鼠标在 mapLayer 坐标系中的位置（相对于 mapLayer 的左上角）
    const mouseInMapX = (mousePosition.x - layer.x) / layer.scale.x;
    const mouseInMapY = (mousePosition.y - layer.y) / layer.scale.y;

    // 计算缩放后的新 scale
    const newScale = event.deltaY > 0 
        ? layer.scale.x / scaleFactor  // 向下滚动，缩小
        : layer.scale.x * scaleFactor; // 向上滚动，放大

    // 确保缩放不会超出最小/最大限制（可选）
    const minScale = 0.2;
    const maxScale = 5;
    if (newScale < minScale || newScale > maxScale) return;

    // 更新缩放
    layer.scale.set(newScale);

    // 调整 mapLayer 的位置，使鼠标指向的位置保持不变
    layer.x = mousePosition.x - mouseInMapX * newScale;
    layer.y = mousePosition.y - mouseInMapY * newScale;
    check_new_bolck(); 
}

function onPinchStart(event) {
    const touches = getTouches(event);
    if (!touches || touches.length < 2) return;
    
    let layer = which();
    
    // 计算两个触摸点之间的距离
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    initialDistance = Math.sqrt(dx * dx + dy * dy);
    
    // 存储初始缩放和位置
    initialScale = layer.scale.x;
    initialPosition.x = (touches[0].clientX + touches[1].clientX) / 2;
    initialPosition.y = (touches[0].clientY + touches[1].clientY) / 2;
    
    // 停止拖动
    layer.dragging = false;
}

// 双指缩放的移动处理
function onPinchMove(event) {
    if (!initialDistance) return;
    
    const touches = getTouches(event);
    if (!touches || touches.length < 2) return;
    
    let layer = which();
    
    // 计算当前两个触摸点之间的距离
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    const currentDistance = Math.sqrt(dx * dx + dy * dy);
    
    // 计算缩放比例
    const scale = initialScale * (currentDistance / initialDistance);
    
    // 限制最小和最大缩放
    const minScale = 0.2;
    const maxScale = 5;
    const clampedScale = Math.min(Math.max(scale, minScale), maxScale);
    
    // 计算中心点位置
    const centerX = (touches[0].clientX + touches[1].clientX) / 2;
    const centerY = (touches[0].clientY + touches[1].clientY) / 2;
    
    // 计算中心点在 layer 坐标系中的位置
    const mouseInMapX = (centerX - layer.x) / layer.scale.x;
    const mouseInMapY = (centerY - layer.y) / layer.scale.y;
    
    // 应用缩放
    layer.scale.set(clampedScale);
    
    // 调整位置，使中心点保持不变
    layer.x = centerX - mouseInMapX * clampedScale;
    layer.y = centerY - mouseInMapY * clampedScale;
    
    check_new_bolck();
}

export function movecamera(x,y){
    // 移动地图层到指定位置
    mapLayer.x = (-x*mapLayer.scale.x)+app.screen.width/2;
    mapLayer.y = (-y*mapLayer.scale.y)+app.screen.height/2;
    check_new_bolck(); 
}

window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
});

function intostar(x,y){
    let bx=Math.floor(x/500);
    let by=Math.floor(y/500);
    let block=beload[[bx,by]];
    if(block){
        for(let st of block.block){
            let pos={x:st.star.x,y:st.star.y}
            if(Math.abs(pos.x-x)<20&&Math.abs(pos.y-y)<20){
                //console.log("click star",st);
                //st.click();
                return st;
            }
        }
    }
    return null;
}

let now_star=null;
function handleClick(event) {
    if (now_view === 'planet') {
        const clpos = getClickPosition(event, planetLayer);
        
        // 检查是否点击中心区域
        if (Math.abs(clpos.x) < 50 && Math.abs(clpos.y) < 50) {
            chose_star(now_star);
            return;
        }
        
        // 检查是否点击行星
        const r = Math.sqrt(clpos.x * clpos.x + clpos.y * clpos.y);
        const angle = Math.atan2(clpos.y, clpos.x);
        
        for (let pl of now_star.planet) {
            if (Math.abs(pl.anglepos - angle) < 0.5 && Math.abs(pl.heigh * 100 - r) < 50) {
                close_planet(pl);
                return;
            }
        }
    } else {
        // 地图视图
        if (mapLayer.lastdrag && Date.now() - mapLayer.lastdrag < 500) {
            return;
        }
        
        const clpos = getClickPosition(event, mapLayer);
        const st = intostar(clpos.x, clpos.y);
        
        if (st) {
            chose_star(st);
        }
    }
}

// 修改坐标获取函数
function getClickPosition(event, targetLayer) {
    return targetLayer.toLocal(new PIXI.Point(event.data.global.x, event.data.global.y));
}

// 修改触摸点获取函数
function getTouches(event) {
    if (event.data.originalEvent?.touches) {
        return event.data.originalEvent.touches;
    }
    return null;
}


export function out_of_star(){
    now_view='map'
    planetLayer.visible=false
    mapLayer.visible=true
    //console.log('into map')
}
let now_view='map'
// 监听键盘事件
window.addEventListener('keydown', (event) => {
    //console.log(event.key);
    if (event.key === 'Escape' && now_view=='planet') {
        out_of_star()
        
    }
});

export function inotsta(st){
    now_view='planet'
    planetLayer.visible=true
    //juzhong
    planetLayer.x=app.screen.width/2
    planetLayer.y=app.screen.height/2
    mapLayer.visible=false
    console.log('into planet',st)
    now_star=st;
    rend_planet(st)
}
window.addEventListener('mousedown', (event) => {
    if (event.button === 2 && now_view=='map') {
        //let pos=event.getLocalPosition(mapLayer);
        let pos=mapLayer.toLocal(new PIXI.Point(event.clientX, event.clientY));
        let st=intostar(pos.x,pos.y);
        if(st){
            inotsta(st)
        }
    }
});
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });