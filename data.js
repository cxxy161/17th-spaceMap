//import {noise} from './perlin.js';
//var noise=require('perlin.js')
//type="module" 
import {hash,rand,PerlinNoise2D,randNormalCLT} from './class.js';
import {xyToPosId} from './class.js';


function creat_star(bx,by,x,y,i){
    //let x = Math.floor(bx*500 + rand([bx,by,i,1],0,500))
    //let y = Math.floor(by*500 + rand([bx,by,i,2],0,500))
    let sx = Math.floor(bx*500+x)
    let sy = Math.floor(by*500+y)
    let temp=randNormalCLT([sx,sy,i,3],7000,6000,12,1000,31000)
    let posid = xyToPosId(sx, sy)

    
    return {
        'x':sx,
        'y':sy,
        'posid':posid,
        'temp':temp,
    }
}


let bloseed=hash(['block'])
let noise=new PerlinNoise2D()
export function getblock(x, y) {
    let stardata=[]
    let bx = x//Math.ceil(x/500);
    let by = y//Math.ceil(y/500);
    /*let n=(noise.get(bx/100,by/100,bloseed+10)+1)*5
    for(let i=0;i<n;i++){
        let r=Math.max(0,noise.get(bx/20,by/20,bloseed+i+11))/10
        let st=noise.get(bx*r,by*r,bloseed+i+11)
        console.log(st,r,n,bx,by,x,y)
        if(st>0){
            stardata.push(creat_star(x,y,i));
        }
    }*/
    let i=0
    let nx = Math.floor(rand([bx,by,i,1],0,500))
    let ny = Math.floor(rand([bx,by,i,2],0,500))
    let molist=[[nx,ny]]
    let starlists=[]
    while(molist.length){
        let idx=Math.floor(rand([x,y,i],0,molist.length-1))
        let ths=molist[idx]
        let r=Math.floor((-(noise.get(ths[0]/20,ths[1]/20,bloseed+i))+1)*100)
        //console.log(r)
        let found=false
        for(let j=0;j<200;j++){
            let theta=rand([x,y,i,j,1],0,2*Math.PI)
            let ra=rand([x,y,i,j,2],0,r)
            let npos=[ths[0]+ra*Math.cos(theta),ths[1]+ra*Math.sin(theta)]
            if(npos[0]<0||npos[1]<0||npos[0]>500||npos[1]>500){
                continue
            }
            let vear=false
            //if(starlists.length<2){vear=true}
            for(let mo of starlists){
                let distance=Math.sqrt((mo[0]-npos[0])**2+(mo[1]-npos[1])**2)
                if((distance<r)){
                    //console.log('too close',distance,r)
                    vear=true
                    break
                }
            }
            if(!vear){
                molist.push(npos)
                starlists.push(npos)
                found=true
                break
            }
        }

        if(!found){
            molist.splice(idx,1)
            //console.log('remove',idx)
        }

        i++
        if(i>1000){
            console.log('too many loop')
            break
        }
    }
    for(let st of starlists){
        stardata.push(creat_star(x,y,st[0],st[1],i));
    }
    //console.log(starlists)
    return stardata;
}
