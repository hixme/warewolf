import warewolf from '../src';

const handler = warewolf(
  (arg1, arg2, next) => {
    // middleware
    next();
  },
  (arg1, arg2, next) => {
    // middleware
    next();
  },
  (arg1, arg2, done) => {
    // after all middleware has been called
    done('success');
  },
);

handler(1, 2, console.log);
// prints 'Success'
