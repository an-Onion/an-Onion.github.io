const list = [1, 2];

const observer = new Proxy(list, {
  set: function(obj, prop, value, receiver) {
    console.log(`prop: ${prop} is changed!`);
    return Reflect.set(...arguments);
  },
});

observer.push(3);
observer[3] = 4;
