import {movecamera} from './Interaction.js';
import {posIdToXY} from './class.js';
//import {app} from './main.js';

let input_gos_go = document.getElementById("pos_input");
let buttun_gos_go = document.getElementById("go_btn");


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

export function chose_star(st){
    let pos=posIdToXY(st.posid);
    console.log("click star",st,pos);
}