let Mediator = { target: null };

function defineReactive(obj, key, val) {
    let listeners  = [];

    Object.defineProperty(obj, key, {
        get() {
            if ( Mediator.target ) {
                listeners.push(Mediator.target);
            }
            return val;
        },
        set(newVal) {
            val = newVal;
            listeners.forEach( (update) => update() );
        },
    });
}

function defineComputed(obj, key, computeFunc, updateCallback) {

    function update() {
        let val = computeFunc.call(obj);
        updateCallback.call(obj, val);
    }

    Mediator.target = update;
    computeFunc.call(obj);
    Mediator.target = null;

    Object.defineProperty (obj, key, {
      get() {
        return computeFunc.call(obj);
      },
    });
}

let gift = {};

defineReactive(gift, "price", 0);

defineComputed(
    gift,
    "status",
    function computed() {
       return this.price > 1024 ? "Smile" : "Cry";
    },
    function cb(val) {
        console.log(val);
    },
);

gift.price = 1314; // Smile
gift.price = 250; // Cry
