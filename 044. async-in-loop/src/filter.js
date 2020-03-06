const getVegetableNum = require('./vegtable.js');

const start = async () => {
  console.log('Start');
  const vegs = ['onion', 'ginger', 'garlic']

  const moreThan1 = vegs.filter(async (veg) => {
    const num = await getVegetableNum(veg);
    return num >= 1;
  });

  console.log(moreThan1);

  console.log('End');
}

start();
