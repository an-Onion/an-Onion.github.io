const throttle1 = (fn, wait = 3000) =>{
  let previous = 0;
  return (...args) => {
    const now = +new Date();
    if( now - previous > wait ){
      previous = now;
      fn.apply(this, args);
    }
  }
}

let clickFn = throttle1(console.log)

clickFn('Onion');
clickFn('Garlic');


const throttle2 = (fn, wait=3000) => {
  let timeId;
  return (...args) => {
    if( timeId ) return;
    timeId = setTimeout(() => {
      fn.apply(this, args);
      timeId = undefined;
    }, wait)
  }
}


let clickFn2 = throttle2(console.log, 1000)

clickFn2('Onion');
clickFn2('Garlic');
