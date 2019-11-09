function asyncFunc(callback) {
  setTimeout(() => {
    callback(new Error('oops'));
  }, 1000);
}

const cb = function callback(err, data) {
  if (err) {
    console.error(err.message);
  }
  // happy path
}

asyncFunc(cb);
