_ = require('underscore');

var x = [{a: 1}, {a: 2}];

console.log(_.findWhere(x, {a: 1}));

var y = {
  a: {x: 1},
  b: {x: 2, f: 3}
};

console.log(_.findWhere(y,{x: 2}))
