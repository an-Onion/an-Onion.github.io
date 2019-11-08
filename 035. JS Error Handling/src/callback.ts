function asyncFunc(callback: (e: Error) => void) {
  setTimeout(() => {
    callback(new Error('oops'));
  }, 1000);
}

asyncFunc((err: Error) => {
  if (err) {
    console.log(err.message);
  }
});
