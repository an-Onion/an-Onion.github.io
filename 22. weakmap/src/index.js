var map = new Map();
var weakmap = new WeakMap();

(function IIFE(){
    var a = {x: 12};
    var b = {y: 12};

    map.set(a, 1);
    weakmap.set(b, 2);
})()

map.forEach((val, key) => console.log(key, val))