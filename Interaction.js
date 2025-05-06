import { app, beload, mapLayer, planetLayer } from "./main.js";
import { check_new_bolck, rend_planet } from "./rend.js";
import { chose_star, close_planet } from "./html_inter.js";

app.stage.interactive = true;
app.stage.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);

// 多指触控状态存储
const onTouchPointerIds = {};
let dragStart = { x: 0, y: 0 }
let lastCenterPoint = null;
let lastDirect = null;
let lastTowPoinDistance = null;
let isDragging = false;
let pointerStartTime = 0;
let pointerStartPosition = { x: 0, y: 0 };

// 修改事件监听器
app.stage
  .on('pointerdown', (event) => {
    event.preventDefault();
    const touches = getTouches(event);
    
    // 记录触控点
    onTouchPointerIds[event.pointerId] = {
      x: event.global.x,
      y: event.global.y,
      pointerId: event.pointerId,
      lastTime: Date.now()
    };
    
    // 清理过期触控点
    for (const i in onTouchPointerIds) {
      if (onTouchPointerIds[i].lastTime + 500 < Date.now()) {
        delete onTouchPointerIds[i];
      }
    }
    
    pointerStartTime = Date.now();
    pointerStartPosition.x = event.global.x;
    pointerStartPosition.y = event.global.y;
    isDragging = false;
    
    let layer = which();
      dragStart.x = event.data.global.x - layer.x;
      dragStart.y = event.data.global.y - layer.y;
      layer.dragging = true;
  })
  .on('pointermove', (event) => {
    event.preventDefault();
    
    // 更新触控点位置
    if (onTouchPointerIds[event.pointerId]) {
      onTouchPointerIds[event.pointerId] = {
        x: event.global.x,
        y: event.global.y,
        pointerId: event.pointerId,
        lastTime: Date.now()
      };
    }
    
    const activePointers = Object.keys(onTouchPointerIds).length;
    
    if (activePointers === 1) {
      // 单指拖动逻辑
      const dx = event.global.x - pointerStartPosition.x;
      const dy = event.global.y - pointerStartPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 10) {
        isDragging = true;
        onDragMove(event);
      }
    } else if (activePointers === 2) {
      // 双指缩放/旋转逻辑
      const [p1, p2] = Object.values(onTouchPointerIds);
      
      // 计算中心点
      const centerPoint = new PIXI.Point(
        (p1.x + p2.x) / 2,
        (p1.y + p2.y) / 2
      );
      
      // 计算双指距离
      const distance = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
      
      if (!lastTowPoinDistance) {
        lastTowPoinDistance = distance;
        lastCenterPoint = centerPoint;
        lastDirect = new PIXI.Point(p2.x - p1.x, p2.y - p1.y);
        return;
      }
      
      // 缩放处理
      const step = distance / lastTowPoinDistance;
      lastTowPoinDistance = distance;
      
      const layer = which();
      const newScale = layer.scale.x * step;
      
      // 限制缩放范围
      const minScale = 0.2;
      const maxScale = 5;
      if (newScale < minScale || newScale > maxScale) return;
      
      layer.scale.set(newScale);
      
      // 调整位置使中心点保持不变
      const mouseInMapX = (centerPoint.x - layer.x) / layer.scale.x;
      const mouseInMapY = (centerPoint.y - layer.y) / layer.scale.y;
      layer.x = centerPoint.x - mouseInMapX * newScale;
      layer.y = centerPoint.y - mouseInMapY * newScale;
      
      check_new_bolck();
    }
  })
  .on('pointerup', (event) => {
    event.preventDefault();
    
    // 移除触控点
    delete onTouchPointerIds[event.pointerId];
    
    // 重置双指状态
    if (Object.keys(onTouchPointerIds).length < 2) {
      lastTowPoinDistance = null;
      lastCenterPoint = null;
      lastDirect = null;
    }
    
    // 处理点击事件
    if (!isDragging && Date.now() - pointerStartTime < 300) {
      handleClick(event);
    }
    
    isDragging = false;
  })
  .on('pointerupoutside', () => {
    // 重置状态
    for (const id in onTouchPointerIds) {
      delete onTouchPointerIds[id];
    }
    lastTowPoinDistance = null;
    lastCenterPoint = null;
    lastDirect = null;
    isDragging = false;
  })
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


function onDragMove(event) {
    const layer = which();
    if (!layer.dragging) {
      layer.dragging = true;
      dragStart.x = event.global.x - layer.x;
      dragStart.y = event.global.y - layer.y;
    }
    
    layer.x = event.global.x - dragStart.x;
    layer.y = event.global.y - dragStart.y;
    layer.lastdrag = Date.now();
    check_new_bolck();
  }
  
  function onWheel(event) {
    event.preventDefault();
    const layer = which();
    const scaleFactor = 1.2;
    const mousePosition = event.global;
    
    const mouseInMapX = (mousePosition.x - layer.x) / layer.scale.x;
    const mouseInMapY = (mousePosition.y - layer.y) / layer.scale.y;
    
    const newScale = event.deltaY > 0 
      ? layer.scale.x / scaleFactor
      : layer.scale.x * scaleFactor;
    
    const minScale = 0.2;
    const maxScale = 5;
    if (newScale < minScale || newScale > maxScale) return;
    
    layer.scale.set(newScale);
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
    return targetLayer.toLocal(new PIXI.Point(event.global.x, event.global.y));
}

// 修改触摸点获取函数
function getTouches(event) {   
    console.log(event) 
    //alert(Object.keys(event.data.originalEvent))
    if (event.originalEvent?.touches) {
        return event.originalEvent.touches;
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