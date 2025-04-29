import { app,beload,mapLayer } from "./main.js";
import { check_new_bolck } from "./rend.js";
import { chose_star } from "./html_inter.js";

app.stage.interactive = true;
app.stage.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);
//mapLayer.buttonMode = true;
//app.stage.eventMode = 'dynamic';
// 变量用于存储鼠标按下时的位置
let dragStart = { x: 0, y: 0 };
let initialDistance = null;
let initialScale = 1;
let initialPosition = { x: 0, y: 0 };

// 监听鼠标按下事件
app.stage.on('mousedown', onDragStart)
    .on('click', click_)
    .on('touchstart', (event) => {
        const touches = getTouches(event);
        if (touches && touches.length >= 2) {
            onPinchStart(event);
        } else {
            onDragStart(event);
        }
    })
    .on('mouseup', onDragEnd)
    .on('mouseupoutside', onDragEnd)
    .on('touchend', (event) => {
        const touches = getTouches(event);
        if (!touches || touches.length < 2) {
            onDragEnd();
            initialDistance = null;
        }
    })
    .on('touchendoutside', onDragEnd)
    .on('mousemove', onDragMove)
    .on('touchmove', (event) => {
        const touches = getTouches(event);
        if (touches && touches.length >= 2) {
            onPinchMove(event);
        } else {
            onDragMove(event);
        }
    })
    .on('wheel', onWheel);

// 添加这个辅助函数来安全地获取触摸点
function getTouches(event) {
    // 尝试不同的方式获取触摸点，兼容不同浏览器和PIXI版本
    return event.data.originalEvent?.touches || 
           event.data.touches || 
           event.touches || 
           [];
}



function onDragStart(event) {
    // 存储鼠标按下时的位置
    //console.log(event.data.global.x,event.data.global.y);
    mapLayer.dragging = true;
    dragStart.x = event.data.global.x - mapLayer.x;
    dragStart.y = event.data.global.y - mapLayer.y;
}

function onDragEnd() {
    // 移除鼠标移动事件监听
    mapLayer.dragging = false;
    
    //mapLayer.eventMode = 'static';
}

function onDragMove(event) {
    // 如果正在拖动地图层
    if (mapLayer.dragging) {
        mapLayer.x = event.data.global.x - dragStart.x;
        mapLayer.y = event.data.global.y - dragStart.y;
        mapLayer.lastdrag = Date.now();
        //mapLayer.eventMode = 'dynamic'; // 或者使用 deprecated 的 mapLayer.interactive = false;
        check_new_bolck(); 
    }
    // 更新地图层的位置
    
}

function onWheel(event) {
    event.preventDefault(); // 防止页面滚动

    const scaleFactor = 1.2; // 缩放因子（1.2 表示每次缩放 20%）
    const mousePosition = event.data.global; // 鼠标在全局坐标系的位置

    // 计算鼠标在 mapLayer 坐标系中的位置（相对于 mapLayer 的左上角）
    const mouseInMapX = (mousePosition.x - mapLayer.x) / mapLayer.scale.x;
    const mouseInMapY = (mousePosition.y - mapLayer.y) / mapLayer.scale.y;

    // 计算缩放后的新 scale
    const newScale = event.deltaY > 0 
        ? mapLayer.scale.x / scaleFactor  // 向下滚动，缩小
        : mapLayer.scale.x * scaleFactor; // 向上滚动，放大

    // 确保缩放不会超出最小/最大限制（可选）
    const minScale = 0.2;
    const maxScale = 5;
    if (newScale < minScale || newScale > maxScale) return;

    // 更新缩放
    mapLayer.scale.set(newScale);

    // 调整 mapLayer 的位置，使鼠标指向的位置保持不变
    mapLayer.x = mousePosition.x - mouseInMapX * newScale;
    mapLayer.y = mousePosition.y - mouseInMapY * newScale;
    check_new_bolck(); 
}

function onPinchStart(event) {
    const touches = event.data.originalEvent.touches;
    
    // 计算两个触摸点之间的距离
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    initialDistance = Math.sqrt(dx * dx + dy * dy);
    
    // 存储初始缩放和位置
    initialScale = mapLayer.scale.x;
    initialPosition.x = (touches[0].clientX + touches[1].clientX) / 2;
    initialPosition.y = (touches[0].clientY + touches[1].clientY) / 2;
    
    // 停止拖动
    mapLayer.dragging = false;
}

// 双指缩放的移动处理
function onPinchMove(event) {
    if (!initialDistance) return;
    
    const touches = event.data.originalEvent.touches;
    
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
    
    // 计算中心点在 mapLayer 坐标系中的位置
    const mouseInMapX = (centerX - mapLayer.x) / mapLayer.scale.x;
    const mouseInMapY = (centerY - mapLayer.y) / mapLayer.scale.y;
    
    // 应用缩放
    mapLayer.scale.set(clampedScale);
    
    // 调整位置，使中心点保持不变
    mapLayer.x = centerX - mouseInMapX * clampedScale;
    mapLayer.y = centerY - mouseInMapY * clampedScale;
    
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

function click_(event){
    if(mapLayer.lastdrag&&Date.now()-mapLayer.lastdrag<500){return}
    let clpos=event.getLocalPosition(mapLayer);
    //console.log(clpos.x,clpos.y);
    let bx=Math.floor(clpos.x/500);
    let by=Math.floor(clpos.y/500);
    let block=beload[[bx,by]];
    if(block){
        for(let st of block.block){
            let pos={x:st.star.x,y:st.star.y}
            if(Math.abs(pos.x-clpos.x)<50&&Math.abs(pos.y-clpos.y)<50){
                //console.log("click star",st);
                //st.click();
                chose_star(st);
                break
            }
        }
    }
}