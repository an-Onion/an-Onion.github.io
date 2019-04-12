const callbacks = []
let pending = false

function flushCallbacks () {

    pending = false
    callbacks.forEach( cb => cb() )
}

let timerFunc = () => {
    Promise.resolve().then(flushCallbacks)
}

function nextTick (cb, ctx) {
    let _resolve
    callbacks.push(() => {
        if (cb) {
            cb.call(ctx)
        } else if (_resolve) {
            _resolve(ctx)
        }
    })

    if (!pending) {
        pending = true
        timerFunc()
    }

    if (!cb) {
        return new Promise((resolve) => {
            _resolve = resolve
        })
    }
}

nextTick().then( () => {
    console.log('Onion')
})

nextTick(() => {
    console.log('Hello')
})

nextTick().then( () => {
    console.log('Garlic')
})

nextTick(() => {
    console.log('World')
})