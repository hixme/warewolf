import warewolf, { mergerware } from '../src/index';

let merge = [];
let compose = [];

function checkComposer() {
  let numberOfCycles = 1000000;

  const ware = warewolf(
    (one, two, next) => setImmediate(next),
    (one, two, done) => {
      done();
    }
  );

  function run() {
    ware(1, 2, () => {
      if (numberOfCycles-- > 0) {
        console.log('COMPOSE', process.memoryUsage());
        run();
      } else {
        compose.push(process.memoryUsage());
        checkMerge();
      }
    });
  }
  compose.push(process.memoryUsage());
  run();
}

function checkMerge() {
  let numberOfCycles = 1000000;

  const ware = mergerware(Object.assign)(
    (one, two, next) => setImmediate(() => next({val: Math.random()})),
    (one, two, next) => setImmediate(() => next({val: Math.random()})),
    (one, two, model, done) => {
      done();
    }
  );

  function run() {
    ware(1, 2, () => {
      if (numberOfCycles-- > 0) {
        console.log('MERGE', process.memoryUsage());
        run();
      } else {
        merge.push(process.memoryUsage());
        final();
      }
    });
  }
  merge.push(process.memoryUsage());
  run();
}

function final() {
  console.log('COMPOSE BEGIN END', ...compose);
  console.log('MERGE BEGIN END', ...merge);
}

checkComposer();
