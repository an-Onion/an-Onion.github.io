function debounce(fn, wait = 1000) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(null, args);
    }, wait);
  };
}

let clickFn = debounce(console.log);

clickFn(1);
clickFn(2);
setTimeout(() => {

  clickFn(3);
}, 2000);

function debounce2(func, wait = 3000, immediate) {
  let timeout;

  return function (...args) {
    let callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      timeout = null;

      if (!immediate) func.apply(this, args);
    }, wait);

    if (callNow) func.apply(this, args);
  };
}


// clickFn = debounce2( console.log, 1000, true );

// clickFn(1);
// clickFn(2);

// setTimeout(() => {clickFn(3);}, 2000);

