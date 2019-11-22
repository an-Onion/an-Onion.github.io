const arr1 = [1, 2, 3];
const arr2 = [];
for(let i = 0; i < arr1.length; i++) {
  arr2.push(arr1[i]+1);
}
console.log(arr2); // [2, 3, 4]


const arr3 = arr1.map( (e) => e+1 );
console.log(arr3); // [2, 3, 4]
