import {movecamera} from './Interaction.js';
import {posIdToXY} from './class.js';
import {savedata} from './data.js';
//import {app} from './main.js';

let input_gos_go = document.getElementById("pos_input");
let buttun_gos_go = document.getElementById("go_btn");
let info_fa_back=document.getElementById("infomation");
let info_conve=document.getElementById("star_info");
let input_star_name=document.getElementById("star_name_input");
let now_star


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
    'luminosity':'光度',
    'radius':'半径',
    'age':'年龄',
    'mass':'质量',
    'gravity':'重力',
    'escape_velocity':'逃逸速度',
    'description':'描述',

}
export function chose_star(st){
    now_star=st
    //let pos=posIdToXY(st.posid);
    console.log("click star",st);
    info_fa_back.style.display = "block"
    info_conve.innerHTML=""
    input_star_name.value=st.data.name
    for(let key of Object.keys(st.star)){
        let fkey
        if(key in fanyi_key){fkey=fanyi_key[key]}
        else{fkey=key}
        let value=fkey+'：'+st.star[key]
        info_conve.innerHTML+=value+'<br>'
    }
}

document.getElementById("input_save").addEventListener("click", function() {
    let name=input_star_name.value;
    let saves={}
    if(name){
        saves.name=name
    }
    savedata(now_star,saves)
})


document.getElementById("close_btn").addEventListener("click", function() {
    now_star=null
    info_fa_back.style.display = "none"
})

