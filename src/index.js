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

function noop() {}

function isPromise(obj) {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

export function mergerware(merger, initial = {}) {
  // high level - returns a function that can merge results
  return function middle(...middleware) {
    // this is the actual warewolf() call
    const argStack = normalizeArgumentArray(middleware);
    let hasCallback = true;
    let isDone = false;
    return (...invocationArguments) => {
      // some assumptions here about how warewolf is called
      // if callback is provided, that's subbed with next() in middleware
      // if no callback, we treat it like a promise
      let done = invocationArguments.pop();
      if (!isFunction(done)) {
        if (done) {
          invocationArguments.push(done);
        }
        done = noop;
        hasCallback = false;
      }
      const stack = [...argStack];
      // used with merger
      let model = initial;
      return new Promise((resolve, reject) => {
        try {
          // wrapping execution with try catch so we can properly reject
          const wrappedMiddlewareStep = (middlewareStep) => {
            // wrapping middlewareStep with some functionality
            const stepArguments = (merger !== undefined && stack.length === 0)
              ? [...invocationArguments, model]
              : invocationArguments;

            const middlewareStepCallback = (err, ...result) => {
              if (err || stack.length === 0) {
                if (err) {
                  if (!hasCallback) {
                    // avoiding unhandled rejection error
                    reject(err);
                  }
                } else {
                  resolve(result[0]);
                }
                isDone = true;
                return done(err, ...result);
              }
              if (merger !== undefined) {
                model = merger(model, ...result, ...invocationArguments);
              }
              const nextStep = stack.shift();
              return wrappedMiddlewareStep(nextStep);
            };

            const result = middlewareStep(...stepArguments, middlewareStepCallback);
            if (result !== undefined && isPromise(result)) {
              return result.then(middlewareStepCallback);
            }
            return result;
          };
          wrappedMiddlewareStep(stack.shift());
        } catch (err) {
          if (hasCallback) {
            if (!isDone) {
              // want to avoid stack overflow
              done(err);
            } else {
              throw err;
            }
          } else {
            reject(err);
          }
        }
      });
    };
  };
}

export default mergerware();
