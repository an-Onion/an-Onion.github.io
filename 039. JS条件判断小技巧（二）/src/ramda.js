const R = require('ramda')


const ownerChain = R.cond([
  [(_, access) => 1 === access, () => console.log('owner in public')],
  [(_, access) => 2 === access, () => console.log('owner in private')],
])

const adminChain = R.cond([
  [(_, access) => 1 === access, () => console.log('admin in public')],
  [(_, access) => 2 === access, () => console.log('admin in private')],
])

const greeting = R.cond([
  [R.equals('owner'), ownerChain],
  [R.equals('admin'), ownerChain],
])

greeting('owner', 1);
greeting('owner', 2);
greeting('admin', 1);
greeting('admin', 2);






