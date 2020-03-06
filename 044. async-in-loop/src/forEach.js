const getVegetableNum = require('./vegtable.js');

const start = async () => {
  const arr = ['onion', 'ginger', 'garlic'];
  console.log('Start');
  arr.forEach(async function callback(veg){
    const num = await getVegetableNum(veg);
    console.log(veg, num);
  })
  console.log('End');
}

start();
