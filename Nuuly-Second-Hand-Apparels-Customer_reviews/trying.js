var fs = require('fs');

let productData = fs.readFileSync("reviews.json","utf-8");
let products = JSON.parse(productData);
console.log(products.length);