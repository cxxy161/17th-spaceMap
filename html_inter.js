import {movecamera} from './Interaction.js';
import {posIdToXY} from './class.js';
import {savedata} from './data.js';
import { datalist } from './main.js';
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
    console.log(st.star.posid,datalist,st.star.posid in datalist)
    if(st.star.posid in datalist){st.data=datalist[st.star.posid]}

    if(st.data){input_star_name.value=st.data.name}
    else{input_star_name.value=""}
    
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



let input_map_data=document.getElementById("map_data_input");
document.getElementById("put_data").addEventListener("click", function() {
    let data=datalist
    let jsonData = JSON.stringify(data, null); // 格式化为 JSON 字符串
    console.log(jsonData); // 打印 JSON 字符串
    //base64
    let base64Data = btoa(jsonData); // 编码为 base64
    console.log(base64Data); // 打印 JSON 字符串
    navigator.clipboard.writeText(base64Data).then(function() {
        console.log('复制成功！');
      }, function(err) {
        console.error('复制失败：', err);
      });
})
document.getElementById("get_map_data").addEventListener("click", function() {
    if(input_map_data.value.length<10){
        alert("输入错误！")
        return
    }
    let base64Data = input_map_data.value;
    let jsonData = atob(base64Data); // 解码为 JSON 字符串
    //console.log(jsonData); // 打印 JSON 字符串
    let data=JSON.parse(jsonData)
    //datalist=data
    Object.keys(datalist).forEach(key => delete datalist[key]) // 清空
    Object.assign(datalist, data)
    console.log(data);
    //app.renderer.resize(window.innerWidth, window.innerHeight);
    //app.renderer.render(app.stage);
})