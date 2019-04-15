const nextTick = require('./nextTick')

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