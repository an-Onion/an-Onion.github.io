// let target = null;

class Dep {

    constructor() {
        this.subscribers = [];
    }
    depend() {
        if( Dep.target && !this.subscribers.includes(Dep.target) ){
            this.subscribers.push(Dep.target);
        }
    }
    notify() {
        this.subscribers.forEach(sub => sub())
    }
}

Dep.target = null;

class Observer {
    constructor (data) {
        Object.keys(data).forEach( Observer.defineReactive.bind(null, data) )
    }

    static defineReactive(obj, key) {
        let val = Reflect.get(obj, key);
        const dep = new Dep();

        Object.defineProperty(obj, key, {
            get () {
                dep.depend();
                return val;
            },
            set (newVal) {
                val = newVal;
                dep.notify();
            }
        })

    }
}

class Vue {
    constructor({data}) {
        this.data = data();
        Object.keys(this.data).forEach( this.proxy.bind(this) );
        new Observer(this.data);
    }

    $mount(watcher) {
        Dep.target = watcher.bind(this);
        watcher.call(this);  // init and register
        Dep.target = null;
    }

    proxy (key) {
        Object.defineProperty(this, key, {
            get () {
                return Reflect.get(this.data, key);
            },
            set (newVal) {
                Reflect.set(this.data, key, newVal)
            }
        })
    }
}

module.exports = Vue;