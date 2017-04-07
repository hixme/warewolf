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
  return function middle(...middleware) {
    const argStack = normalizeArgumentArray(middleware);
    return (...invocationArguments) => {
      let done = invocationArguments.pop();
      if (!isFunction(done)) {
        if (done) {
          invocationArguments.push(done);
        }
        done = noop;
      }
      const stack = [...argStack];
      let model = initial;
      const next = (step) => {
        const stepArguments = (merger !== undefined && stack.length === 0)
          ? [...invocationArguments, model]
          : invocationArguments;

        const stepNext = (...result) => {
          if (stack.length === 0) {
            return done(...result);
          }
          if (merger !== undefined) {
            model = merger(model, ...result, ...invocationArguments);
          }
          const nextStep = stack.shift();
          return next(nextStep);
        };

        const result = step(...stepArguments, stepNext);

        if (isPromise(result)) {
          return result.then(stepNext);
        }
        return result;
      };
      return next(stack.shift());
    };
  };
}

export default mergerware();
