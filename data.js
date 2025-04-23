


function creat_star(bx,by){
    let x = Math.floor(bx*500 + Math.random()*500)
    let y = Math.floor(by*500 + Math.random()*500)
    return {'x':x,'y':y}
}



function getblock(x, y) {
    let stardata=[]
    let bx = Math.ceil(x/500);
    let by = Math.ceil(y/500);
    for(let i=0;i<10;i++){
        stardata.push(creat_star(x,y));
    }
    return stardata;
}
