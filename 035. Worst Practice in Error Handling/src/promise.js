function asyncFunction() {
  return new Promise((resolve, reject) => {
     setTimeout(() => {
       reject(new Error('oops'))
     }, 1000);
  })
}

asyncFunction()
 .then(() => {
     // happy path
 })
 .catch((err) => {
     console.error(err.message)
 })

console.log('Hello')
