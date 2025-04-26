import {movecamera} from './Interaction.js';
import {posIdToXY} from './class.js';
//import {app} from './main.js';

let input_gos_go = document.getElementById("pos_input");
let buttun_gos_go = document.getElementById("go_btn");
let info_fa_back=document.getElementById("infomation");
let info_conve=document.getElementById("star_info");

buttun_gos_go.addEventListener("click", function() {
    let value = input_gos_go.value;
    let pos = [0,0]
    if(/[PN]/.test(value)){
        let posxy=posIdToXY(value);
        pos = [posxy.x,posxy.y]
    }
    else{
        pos = value.split("/");
        if(pos.length!=2){
            alert("输入错误！"+pos)
            return
        }
    }
    console.log("go to",pos);
    movecamera(pos[0],pos[1])
})

var fanyi_key={
    'posid':'位置ID',
    'name':'名称',
    'type':'类型',
    'temp':'温度',

}
export function chose_star(st){
    let pos=posIdToXY(st.posid);
    console.log("click star",st,pos);
    info_fa_back.style.display = "block"
    info_conve.innerHTML=""
    for(let key of Object.keys(st)){
        let fkey
        if(key in fanyi_key){fkey=fanyi_key[key]}
        else{fkey=key}
        let value=fkey+'：'+st[key]
        info_conve.innerHTML+=value+'<br>'
    }
}

document.getElementById("close_btn").addEventListener("click", function() {
    info_fa_back.style.display = "none"
})
