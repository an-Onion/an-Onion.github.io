const getVegetableNum = require('./vegtable.js');

const fetchNums = (vegs) => {
  const promises = vegs.map(getVegetableNum);
  return Promise.all(promises);
}

const start = async () => {
  console.log('Start');

  const nums = await fetchNums( ['onion', 'ginger', 'garlic'] );
  console.log(nums);

  console.log('End');
}

start();
