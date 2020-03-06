const getVegetableNum = require('./vegtable.js');

const start = async () => {
  console.log('Start');
  const vegs = ['onion', 'ginger', 'garlic']

  const promises = vegs.map(async function callback(veg) {
    console.log(veg, 'cb');
    const num = await getVegetableNum(veg);
    console.log(veg, num);
  });

  console.log(promises);

  console.log('End');
}

start();
