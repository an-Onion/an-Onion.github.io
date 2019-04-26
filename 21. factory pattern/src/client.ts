
import {Drink} from './Drink';
import {VegetableFactory} from './SimpleFactory';
import {Vegetable} from './Vegetable';

import {OnionPicker, VegetablePicker} from './FactoryMethod';

import {GarlicRecipeFacotry, OnionRecipeFacotry, RecipeFactory} from './AbstractFactory';

const factory: VegetableFactory = new  VegetableFactory();

let onion: Vegetable = factory.createOnion();
let garlic: Vegetable = factory.createGarlic();

onion.fry();
garlic.fry();

console.log('----------------');

const picker: VegetablePicker = new OnionPicker();

onion = picker.pick();

onion.fry();

console.log('----------------');

const onionRecipe: RecipeFactory = new OnionRecipeFacotry();
const garlicRecipe: RecipeFactory = new GarlicRecipeFacotry();

onion = onionRecipe.create();
garlic = garlicRecipe.create();

onion.fry();
garlic.fry();

const wind: Drink = onionRecipe.pick();
const beer: Drink = garlicRecipe.pick();

wind.taste();
beer.taste();
