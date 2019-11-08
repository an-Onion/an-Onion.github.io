function memoryUsage() {
    const used = process.memoryUsage().heapUsed;
    console.log( Math.round(used / 1024 / 1024) + "M" );
}

global.gc();
memoryUsage(); // ≈ 4M

let arr = new Array(1024 * 1024);
const map = new Map();

map.set(arr, 1);
global.gc();
memoryUsage(); // ≈ 12M

arr = null;
global.gc();
memoryUsage(); // ≈ 12M
