const callbacks = [];
let pending = false;

function flushCallbacks() {

    pending = false;
    callbacks.forEach( cb => cb() );
}

let timerFunc = () => {
    Promise.resolve().then(flushCallbacks);
};

module.exports = function nextTick(cb, ctx) {
    let res;
    callbacks.push(() => {
        cb ? cb.call(ctx) : res(ctx);
    });

    if (!pending) {
        pending = true;
        timerFunc();
    }

    if (!cb) {
        return new Promise((resolve) => {
          res = resolve;
        });
    }
};
