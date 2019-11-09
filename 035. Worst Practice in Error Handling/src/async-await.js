function asyncFunction() {
  return new Promise((resolve, reject) => {
     setTimeout(() => {
       reject(new Error('oops'))
     }, 1000);
  });
}

(async() => {
 try {
     return await asyncFunction();
     // happy path
 } catch (err) {
   console.error(err.message);
 }
 console.log('Hello')
})();

(() => {
  try {
    return asyncFunction()
  } catch (err) {
    console.error(err.message);
  }
})()

process.on('uncaughtException', (err) => {
  console.warn('an uncaught exception detected', err.message);
  // process.exit(-1);
});

process.on('unhandledRejection', (err) => {
  console.warn('an unhandled rejection detected', err.message);
  // process.exit(-1);
});
