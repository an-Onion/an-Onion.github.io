const getVegetableNum = require('./vegtable.js');

const start = async () => {
  console.log('Start');
  const vegs = ['onion', 'ginger', 'garlic']

  const sum = await vegs.reduce(async (acc, veg) => {
    const num = await getVegetableNum(veg);
    return (await acc) + num;
  }, 0);

  console.log(sum);

  console.log('End');
}

start();
