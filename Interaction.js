import { app,beload,mapLayer } from "./main.js";
import { check_new_bolck } from "./rend.js";
import { chose_star } from "./html_inter.js";

app.stage.interactive = true;
app.stage.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);
//mapLayer.buttonMode = true;
//app.stage.eventMode = 'dynamic';
// 变量用于存储鼠标按下时的位置
let dragStart = { x: 0, y: 0 };

// 监听鼠标按下事件
app.stage.on('click',click_)
        .on('mousedown', onDragStart)  
        .on('touchstart', onDragStart)
        //.on('touchstart', onTouchStart)
        .on('mouseup', onDragEnd)
        .on('mouseupoutside', onDragEnd)
        .on('touchend', onDragEnd)
        
        .on('touchendoutside', onDragEnd)
        .on('mousemove', onDragMove)
        .on('touchmove', onDragMove)
        .on('wheel', onWheel);


function click_(event){
    if(mapLayer.dragging){return}
    let clpos=event.getLocalPosition(mapLayer);
    console.log(clpos.x,clpos.y);
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
let touchStartDist = 0;
let touchStartScale = 1;

function getTouchDistance(touches) {
    const [touch1, touch2] = touches;
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function onTouchStart(event) {
    if (event.touches.length === 2) {
        touchStartDist = getTouchDistance(event.touches);
        touchStartScale = mapLayer.scale.x; // 保存开始缩放前的scale
    }
}

function onTouchMove(event) {
    if (event.touches.length === 2 && mapLayer.dragging) {
        const currentDist = getTouchDistance(event.touches);
        const scaleFactor = currentDist / touchStartDist;
        const newScale = touchStartScale * scaleFactor;

        const minScale = 0.2;
        const maxScale = 5;
        if (newScale < minScale || newScale > maxScale) return;

        mapLayer.scale.set(newScale);

        // 计算双指中心点在全局坐标系的位置
        const touchMidX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
        const touchMidY = (event.touches[0].clientY + event.touches[1].clientY) / 2;

        // 计算双指中心点在 mapLayer 坐标系中的位置
        const mouseInMapX = (touchMidX - mapLayer.x) / mapLayer.scale.x;
        const mouseInMapY = (touchMidY - mapLayer.y) / mapLayer.scale.y;

        // 调整 mapLayer 的位置，使双指中心点保持不变
        mapLayer.x = touchMidX - mouseInMapX * newScale;
        mapLayer.y = touchMidY - mouseInMapY * newScale;
        check_new_bolck();
    }
}

function onTouchEnd() {
    mapLayer.dragging = false;
}

// 将触摸事件添加到监听中
app.stage.on('touchstart', event => {
    onTouchStart(event);
    onDragStart(event);
}).on('touchmove', event => {
    onTouchMove(event);
    onDragMove(event);
}).on('touchend', onTouchEnd);



export function movecamera(x,y){
    // 移动地图层到指定位置
    mapLayer.x = (-x*mapLayer.scale.x)+app.screen.width/2;
    mapLayer.y = (-y*mapLayer.scale.y)+app.screen.height/2;
    check_new_bolck(); 
}


window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
});