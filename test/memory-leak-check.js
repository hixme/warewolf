import warewolf from '../src/index';

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
        final();
      }
    });
    ware(1, 2, () => {
      console.log('-');
    });
  }
  compose.push(process.memoryUsage());
  run();
}



function final() {
  console.log('COMPOSE BEGIN END', ...compose);
}

checkComposer();
