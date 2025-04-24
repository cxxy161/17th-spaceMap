app.stage.interactive = true;
app.stage.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);
//mapLayer.buttonMode = true;
//app.stage.eventMode = 'dynamic';
// 变量用于存储鼠标按下时的位置
let dragStart = { x: 0, y: 0 };

// 监听鼠标按下事件
app.stage.on('mousedown', onDragStart)
        .on('touchstart', onDragStart)
        //.on('touchstart', onTouchStart)
        .on('mouseup', onDragEnd)
        .on('mouseupoutside', onDragEnd)
        .on('touchend', onDragEnd)
        
        .on('touchendoutside', onDragEnd)
        .on('mousemove', onDragMove)
        .on('touchmove', onDragMove)
        .on('wheel', onWheel);

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

