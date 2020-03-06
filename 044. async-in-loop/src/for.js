const getVegetableNum = require('./vegtable.js');


const start = async () => {
  const arr = ['onion', 'ginger', 'garlic'];
  console.log('Start');
  for(let veg of arr){
    const num = await getVegetableNum(veg);
    console.log(veg, num);
  }
  console.log('End');
}
start()
