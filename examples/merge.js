import { mergerware } from '../src';

const initial = 5;
const mergeFunc = (current, result) => current + result;
const addcomposer = mergerware(mergeFunc, initial);

const handler = addcomposer(
  (arg1, next) => {
    // adds 10
    next(10);
  },
  (arg1, next) => {
    // adds 5
    next(5);
  },
  (ar1, result, done) => {
    done(result);
  }
);

handler(1, console.log);
// prints 20
