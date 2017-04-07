# Warewolf [![Build Status](https://travis-ci.org/hixme/warewolf.svg?branch=master)](https://travis-ci.org/hixme/warewolf)
Savage Async Middleware.

Connect style middleware with promise support. 

# Install

`npm i warewolf --save`

# Usage

Warewolf generates a function that can be called with any number of arguments. 

Every function passed will asynchronously wait for a promise to be returned or `next` to be called.

## Middleware

```js
import warewolf from 'warewolf';

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
  }
);

handler(1, 2, console.log);
// prints 'Success'

```

## Composed middleware

```js
import warewolf from 'warewolf';

const ware1 = warewolf(
  (arg1, arg2, next) => {
    // middleware
    next();
  },
  (arg1, arg2, next) => {
    // middleware
    next();
  }
);

const ware2 = warewolf(
  (arg1, arg2, next) => {
    // middleware
    next();
  },
  (arg1, arg2, next) => {
    // middleware
    next();
  }
);

const handler = warewolf(ware2, ware1, (arg1, arg2, done) => {
  done('Success');
}));

handler(1, 2, console.log);
// prints 'Success'
```

## Promises

You can also return promises instead of calling next.

```js
import warewolf from 'warewolf';

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

```

## Merger middleware

If you want to continually reduce a value, pass a merger function to the top level `mergerware` method.

```js
import { mergerware } from 'warewolf';

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

```

# Gotchas

## Arg count

Whatever you final handler accepts as arguments will be the number of arguments passed to your middleware, so it needs to be uniform!

Getting around this isn't that hard though.

```js
function myShortMiddleware(arg1, next) {
  // middleware
  next();
}

function myLongMiddleware(arg1, arg2, next) {

}

const handler = warewolf(
  myLongMiddleware,
  (arg1, arg2, next) => myShortMiddleware(arg1, next),
  (arg1, arg2, done) => {
    // that was fun
  }
);

handler(arg1, arg2, done);
```

## Mutable Merge Values

When using mergerware, your initial value is accessed by your merger, be careful to return something and not break the original value.

```js
import { mergerware } from 'warewolf';

const initial = {};
const mergeFunc = (current, result) => {
  // no! bad!
  current.value = result;  
  return current;
};
const mergecomposer = mergerware(mergeFunc, initial);

// instead
const initial = {};
const mergeFunc = (current, result) => {
  // yes! good!    
  return {
    ...current,
    value: result,
  };
};
const mergecomposer = mergerware(mergeFunc, initial);
```

## License

MIT
