# Warewolf [![Build Status](https://travis-ci.org/hixme/warewolf.svg?branch=master)](https://travis-ci.org/hixme/warewolf)
Savage Async Middleware. :wolf:

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
    done(null, 'success');
  }
);

handler(1, 2, console.log);
// prints [null, 'success']

```

## Composer

Wrap each step - even pass different args!

```js
import { wareBuilder } from 'warewolf';

const handler = wareBuilder(step => {
  return (arg1, arg2, next) => {
    console.log('BEFORE');
    const result = step(arg1, arg2, next);
    console.log('AFTER');
    return result;
  }
})(
  (arg1, arg2, next) => {
    // middleware
    next();
  },
  (arg1, arg2, done) => {
    // after all middleware has been called
    done(null, 'success');
  }
);

handler(1, 2, console.log);
// prints 'BEFORE'
// prints 'AFTER'
// prints 'BEFORE'
// prints 'AFTER'
// prints [null, 'success']

```

## Errors

Just like connect, we'll stop iteration if next receives a value or if an error is thrown.

```js
import warewolf from 'warewolf';

const handler = warewolf(
  (arg1, arg2, next) => {
    // middleware
    next('error');
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
// prints 'error'

```

Also, just like express, if you add a middleware method with an arity + 1 of the main stack call, warewolf treats this method like an error handler.
 
```js
import warewolf from 'warewolf';

const handler = warewolf(
  (arg1, arg2, next) => {
    // middleware
    next('error');
  },
  (err, arg1, arg2, next) => {
    // error handler!
    console.error(err);
    next();
  },
  (arg1, arg2, done) => {
    // this is still called
    done('success');
  }
);

handler(1, 2, console.log);
// prints 'error'
// prints 'success'

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
  done(null, 'success');
}));

handler(1, 2, console.log);
// prints [null, 'success']
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
  (arg1, arg2) => {
    // after all middleware has been called
    return new Promise(resolve => resolve('success'));
  }
);

handler(1, 2).then(console.log);
// prints 'success'

```

# Gotchas

## Middleware Arity

Unless you are creating an error handler, whatever you final handler accepts as arguments will be the number of arguments passed to your middleware, so it needs to be uniform!

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

## License

MIT
