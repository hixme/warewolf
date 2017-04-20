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

export function wareBuilder() {
  // high level - returns a function that can merge results
  return function middle(...middleware) {
    // this is the actual warewolf() call
    const middlewareQueue = normalizeArgumentArray(middleware);
    let hasCallback = true;
    let isDone = false;
    return (...invocationArguments) => {
      // some assumptions here about how warewolf is called
      // if callback is provided, that's subbed with next() in middleware
      // if no callback, we treat it like a promise
      const arity = invocationArguments.length;
      const isErrorMethod = fn => fn.length === arity + 1;

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
          && (err ? !isErrorMethod(middlewareQueue[0]) : isErrorMethod(middlewareQueue[0]))) {
            middlewareQueue.shift();
          }
          if (middlewareQueue.length) {
            const fn = middlewareQueue.shift();
            return err ? fn.bind(this, err) : fn;
          }
          return null;
        }

        let nextStep;
        try {
          nextStep = (err, ...args) => {
            const nextFn = moveToNext(err);
            if (!nextFn) {
              isDone = true;
              return done(err, ...args);
            }
            const flowArgs = hasCallback ? [nextStep] : [];

            const result = nextFn(...invocationArguments, ...flowArgs);
            if (isPromise(result)) {
              result.then(r => nextStep(null, r)).catch(nextStep);
            } else if (!hasCallback) {
              return nextStep(err, result);
            }
            return result;
          };


          return nextStep();
        } catch (e) {
          if (e.name === 'AssertionError') {
            throw e;
          }
          if (middlewareQueue.find(isErrorMethod) && nextStep) {
            return nextStep(e);
          }
          if (!isDone) {
            return done(e);
          }
          throw e;
        }
      };

      if (!hasCallback) {
        return new Promise(promiseBody);
      }
      return promiseBody();
    };
  };
}

export default wareBuilder();
