function flatten(arg) {
  return arg.reduce(
    (memo, item) =>
      (
        Array.isArray(item)
          ? [...memo, ...flatten(item)]
          : [...memo, item]
      ),
    [],
  );
}

function normalizeArgumentArray(args) {
  return flatten(args).filter(item => !!item);
}

function isFunction(fn) {
  return typeof fn === 'function';
}

function isPromise(obj) {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

const DEFAULT_COMPOSER = fn => fn;
const DEFAULT_IS_ERROR_METHOD = (fn, arity) => fn.length === arity + 1;

export function wareBuilder(
  composer = DEFAULT_COMPOSER,
  errorComposer = composer,
  {
    isErrorMethod = DEFAULT_IS_ERROR_METHOD,
  } = {},
) {
  // high level - returns a function that can merge results
  return function middle(...middleware) {
    // this is the actual warewolf() call
    return (...invocationArguments) => {
      let hasCallback = true;
      const middlewareQueue = normalizeArgumentArray(middleware);
      let isDone = false;
      // some assumptions here about how warewolf is called
      // if callback is provided, that's subbed with next() in middleware
      // if no callback, we treat it like a promise
      const arity = invocationArguments.length;

      let done = invocationArguments.pop();
      if (!isFunction(done)) {
        if (done) {
          invocationArguments.push(done);
        }
        hasCallback = false;
      }

      const promiseBody = (resolve, reject) => {
        if (!hasCallback) {
          done = (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          };
        }

        function moveToNext(err) {
          while (middlewareQueue.length
          && (err
              ? !isErrorMethod(middlewareQueue[0], arity, invocationArguments)
              : isErrorMethod(middlewareQueue[0], arity, invocationArguments))
            ) {
            middlewareQueue.shift();
          }
          if (middlewareQueue.length) {
            const fn = middlewareQueue.shift();
            return err ? errorComposer(fn.bind(this, err)) : composer(fn);
          }
          return null;
        }

        function nextStep(index, err, ...resultFromStep) {
          if (index !== middlewareQueue.length) {
            isDone = true;
            done('Error: next() has been called multiple times. Be careful not to return a promise and call a callback in the same method.');
            return;
          }
          const nextFn = moveToNext(err);
          const nextStepWithIndex = nextStep.bind(this, middlewareQueue.length);
          try {
            if (!nextFn) {
              isDone = true;
              done(err, ...resultFromStep);
              return;
            }
            const flowArgs = hasCallback ? [nextStepWithIndex] : [];

            const result = nextFn(...invocationArguments, ...flowArgs);
            if (isPromise(result)) {
              result.then(r => nextStepWithIndex(null, r)).catch(nextStepWithIndex);
            } else if (!hasCallback) {
              nextStepWithIndex(err, result);
            }
          } catch (e) {
            if (e.name === 'AssertionError') {
              throw e;
            }
            if (middlewareQueue.find(fn => isErrorMethod(fn, arity, invocationArguments))) {
              nextStepWithIndex(e);
              return;
            }
            if (!isDone) {
              done(e);
              return;
            }
            throw e;
          }
        }
        nextStep(middlewareQueue.length);
      };

      if (!hasCallback) {
        return new Promise(promiseBody);
      }
      return promiseBody();
    };
  };
}

export default wareBuilder();
