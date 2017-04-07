import warewolf from '../src';

const ware1 = warewolf(
  (arg1, arg2, next) => {
    // middleware
    next();
  },
  (arg1, arg2, next) => {
    // middleware
    next();
  },
);

const ware2 = warewolf(
  (arg1, arg2, next) => {
    // middleware
    next();
  },
  (arg1, arg2, next) => {
    // middleware
    next();
  },
);

const handler = warewolf(ware2, ware1, (arg1, arg2, done) => {
  done('Success');
});

handler(1, 2, console.log);
// prints 'Success'
