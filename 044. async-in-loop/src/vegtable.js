const Basket = {
  onion: 1,
  ginger: 2,
  garlic: 3,
}

const getVegetableNum = async (veg) => Basket[veg];

module.exports  = getVegetableNum;


const start = async () => {
  console.log('Start')
  const onion = await getVegetableNum('onion');
  console.log('onion', onion);

  const ginger = await getVegetableNum('ginger');
  console.log('ginger', ginger);

  const garlic = await getVegetableNum('garlic');
  console.log('garlic', garlic);
  console.log('End');
}

start();
