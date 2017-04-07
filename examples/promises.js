import warewolf from '../src';

const handler = warewolf(
  (arg1, arg2) => {
    // middleware
    return new Promise(resolve => setImmediate(resolve));
  },
  (arg1, arg2) => {
    // middleware
    return new Promise(resolve => setImmediate(resolve));
  },
  (arg1, arg2, done) => {
    // after all middleware has been called
    return new Promise(resolve => resolve('Success'));
  }
);

handler(1, 2, console.log);
// prints 'Success'
