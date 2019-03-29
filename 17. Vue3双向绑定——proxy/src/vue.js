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

    static defineReactive(data) {

        let deps = new Map();

        function depReflect(prop, func) {
            if( !deps.has(prop) )
                deps.set(prop, new Dep());
            const dep = deps.get(prop);

            return func.call(dep);
        }

        return new Proxy(data, {
            get(obj, prop) {
                depReflect(prop, Dep.prototype.depend);
                return Reflect.get(obj, prop);
            },
            set(obj, prop, newVal) {
                Reflect.set(obj, prop, newVal);
                depReflect(prop, Dep.prototype.notify);
            }
        })
    }
}

class Vue {
    constructor({data}) {
        this.$data = Observer.defineReactive(data());
        Object.keys(this.$data).forEach( this.proxy.bind(this) );
    }

    $mount(watcher) {
        Dep.target = watcher.bind(this);
        watcher.call(this);  // init and register
        Dep.target = null;
    }

    proxy (key) {
        Object.defineProperty(this, key, {
            get () {
                return Reflect.get(this.$data, key);
            },
            set (newVal) {
                Reflect.set(this.$data, key, newVal)
            }
        })
    }
}

module.exports = Vue;