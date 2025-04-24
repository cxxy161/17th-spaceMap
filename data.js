


function creat_star(bx,by,i){
    let x = Math.floor(bx*500 + rand([bx,by,i,1],0,500))
    let y = Math.floor(by*500 + rand([bx,by,i,2],0,500))
    let temp=rand([bx,by,i,3],1000,31000)
    return {
        'x':x,
        'y':y,
        'temp':temp,
    }
}



function getblock(x, y) {
    let stardata=[]
    let bx = Math.ceil(x/500);
    let by = Math.ceil(y/500);
    for(let i=0;i<10;i++){
        stardata.push(creat_star(x,y,i));
    }
    return stardata;
}
