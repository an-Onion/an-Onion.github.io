const Vue = require("./vue");

/* Step 1 */
let watcher = function() {
    const total = this.price * this.quantity;
    console.log(`total = ${total}`);
};

/* Step 2 */
let vm = new Vue({
  data: () => ( {
    price: 5,
    quantity: 2,
  }),
});

/* Step 3 */
vm.$mount( watcher );

vm.price = 100;
vm.quantity = 100;
