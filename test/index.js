import { assert } from 'chai';
import warewolf, { wareBuilder } from '../src/index';

const noop =  () => {};

describe('warewolf.', () => {
  it('should run a no-op', () => {
    let item;
    const compare = 'RESULT';
    const ware = warewolf(
      () => {
        item = compare;
      }
    );
    ware();
    assert(item === compare, 'Item not assigned');
  });
  it('should run a one-op', () => {
    let item;
    const compare = 'RESULT';
    const ware = warewolf(
      (next) => {
        item = compare;
        next();
      }
    );
    ware(noop);
    assert(item === compare, 'Item not assigned');
  });

  it('should compose', () => {
    let item;
    const compare = 'RESULT';
    const ware = wareBuilder(fn => (...args) => {
      item = compare;
      return fn(...args);
    })(
      (next) => {
        next();
      }
    );
    ware(noop);
    assert(item === compare, 'Item not assigned');
  });

  it('should error compose', () => {
    let item;
    const compare = 'RESULT';
    const ware = wareBuilder(fn => fn, fn => (...args) => {
      item = compare;
      return fn(...args);
    })(
      (next) => {
        throw 'error';
      },
      (err, next) => {
        next();
      }
    );
    ware(noop);
    assert(item === compare, 'Item not assigned');
  });

  it('should run a array', () => {
    let item = [];
    const compare = [1, 2, 3];
    const ware = warewolf(
      [
        (next) => {
          item.push(1);
          next();
        },
        (next) => {
          item.push(2);
          next();
        },
        (next) => {
          item.push(3);
          next();
        }
      ]
    );
    ware(noop);
    assert.deepEqual(item, compare, 'Item not equal');
  });

  it('should run args', () => {
    let item = [];
    const compare = [1, 2, 3];
    const ware = warewolf(

        (next) => {
          item.push(1);
          next();
        },
        (next) => {
          item.push(2);
          next();
        },
        (next) => {
          item.push(3);
          next();
        }

    );
    ware(noop);
    assert.deepEqual(item, compare, 'Item not equal');
  });

  it('should emmit on error', () => {
    const ware = warewolf(
      [
        (next) => {
          next('error');
        },
        (next) => {
          assert.fail('Should not resolve');
          next();
        },
      ]
    );
    ware(err => assert.isOk(err === 'error', 'Error not equal'));
  });

  it('should catch an error with error middleware', () => {
    const ware = warewolf(
      [
        (next) => {
          next('error');
        },
        (err, next) => {
          assert.isOk(err === 'error', 'Error not equal');
          next();
        },
      ]
    );
    ware(err => assert.isOk(err === undefined || err === null, 'Error should have been caught, got ' + err + ' instead'));
  });

  it('should catch a thrown error with error middleware', (done) => {
    const ware = warewolf(
      [
        (next) => {
          setTimeout(next, 100);
        },
        () => {
          throw 'errorFirst';
        },
        (err, next) => {
          assert.isOk(err === 'errorFirst', 'Error not equal');
          setTimeout(next, 100);
        },
        () => {
          throw 'error2';
        },
        (err, next) => {
          assert.isOk(err === 'error2', 'Error not equal');
          setTimeout(next, 100);
        },
        () => {
          throw 'error3';
        },
      ]
    );
    ware(err => {
      assert.isOk(err === 'error3', 'Error not equal');
      done();
    });
  });

  it('should strip error from final call', (done) => {
    const ware = warewolf(
      [
        (next) => {
          next();
        },
        () => {
          throw 'error';
        },
        (err, next) => {
          assert.isOk(err === 'error', 'Error not equal');
          next();
        },
      ]
    );
    ware(err => {
      assert.isOk(err === undefined || err === null, 'Error should have been caught, got ' + err + ' instead');
      done();
    });
  });

  it('should emmit on throw', () => {
    const ware = warewolf(
      [
        () => {
          throw new Error('error');
        },
        (next) => {
          assert.fail('Should not resolve');
          next();
        },
      ]
    );
    ware(err => assert.isOk(err.message === 'error', 'Error not equal'));
  });

  it('should not accumulate errors', done => {
    let count = 0;
    const ware = warewolf(
      [
        (next) => {
          next();
        },
        (next) => {
          next();
        },
        (next) => {
          next();
        },
        (next) => {
          next();
        },
        () => {
          throw 'error';
        },
        (err, next) => {
          count ++;
          next();
        },
        (err, next) => {
          assert.fail('ERROR HANDLED ALREADY');
          next();
        },
        (next) => {
          count ++;
          setTimeout(() => {
            next();
          }, 10);
        },
        (next) => {
          count ++;
          assert.isOk(count === 3, 'method called out of order');
          next();
        },
      ]
    );

      ware(() => {
        done();

      });


  });

  it('should throw on final ware throw', () => {
    const ware = warewolf(
      [
        (next) => {
          throw 'error';
        },
      ]
    );
    ware(err => assert.isOk(err === 'error', 'Error not equal'));
  });

  describe('asynchronous', () => {
    it('should iterate', done => {
      function next(next) {
        setTimeout(next, 1);
      }
      let to;
      const ware = warewolf(
        next,
        next,
        next,
        () => {
          assert.isOk(true);
          clearTimeout(to);
          done();
        }
      );
      ware(noop);
      to = setTimeout(() => assert.fail('Timed out'), 10);
    });

    it('should handle iteration freeze', done => {
      function next(req, res, next) {

      }

      const ware = warewolf(
        next,
        next,
        next,
        () => {
          assert.fail('Should not resolve');
        }
      );
      ware({}, {}, noop);
      setTimeout(() => {
        assert.isOk(true);
        done();
      }, 10);
    });
  });

  describe('promises', () => {
    it('should throw on too many next calls', done => {

      const ware = warewolf(
        (one, next) => {
          next();
          return new Promise(resolve => setTimeout(resolve, 1));
        },
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
      ware(1, (err) => {
        assert.isOk(!!err);
        done();
      });
    });
    it('should support resolvers', done => {
        let to;
        function next() {
          return new Promise(resolve => setTimeout(resolve, 1));
        }

        const ware = warewolf(
          next,
          next,
          next,
          () => {
            assert.isOk(true);
            clearTimeout(to);
            done();
          }
        );
        ware();
        to = setTimeout(() => assert.fail('Timed out'), 10);

    });

    it('should support root resolvers', done => {
      function next() {
        return new Promise(resolve => setTimeout(resolve, 1));
      }
      let to;
      const ware = warewolf(
        next,
        next,
        next,
      );
      ware().then(() => {
        assert.isOk(true);
        clearTimeout(to);
        done();
      });
      to = setTimeout(() => assert.fail('Timed out'), 10);
    });


    it('should support throws', done => {
      function next() {
        throw 'error';
      }
      let to;
      const ware = warewolf(
        next,
      );
      ware().catch((err) => {
        assert.isOk(err === 'error');
        clearTimeout(to);
        done();
      });
      to = setTimeout(() => assert.fail('Timed out'), 10);
    });

    it('should not resolve', done => {
      function next(req, res, next) {

      }

      const ware = warewolf(
        next,
        next,
        next,
        () => {
          assert.fail('Should not resolve');
        }
      );
      ware(noop);
      setTimeout(() => {
        assert.isOk(true);
        done();
      }, 10);
    });
  });

  it('should pipe a mutable object', () => {
    const req = {locals: {}};
    const res = {};
    const compare = {
      item1: 'hello',
      item2: 'world'
    };
    const ware = warewolf(

      (req, res, next) => {
        req.locals.item1 = compare.item1;
        next();
      },
      (req, res, next) => {
        req.locals.item2 = compare.item2;
        next();
      },
      (_req) => {
        assert.deepEqual(_req.locals, compare, 'Locals not equal');
      }
    );
    ware(req, res, noop);
  });

  it('should be composable', () => {
    const req = {locals: {}};
    const res = {};
    const compare = {
      item1: 'hello',
      item2: 'world',
      item3: 'hello my',
      item4: 'honey',
    };
    const ware1 = warewolf(

      (req, res, next) => {
        req.locals.item1 = compare.item1;
        next();
      },
      (req, res, next) => {
        req.locals.item2 = compare.item2;
        next();
      },
    );

    const ware2 = warewolf(

      (req, res, next) => {
        req.locals.item3 = compare.item3;
        next();
      },
      (req, res, next) => {
        req.locals.item4 = compare.item4;
        next();
      },
      (_req) => {
        assert.deepEqual(_req.locals, compare, 'Locals not equal');
      }
    );

    const ware = warewolf(ware1, ware2, noop);

    ware(req, res, noop);
  });

  it('should flatten arguments', () => {
    const req = {locals: []};
    const res = {};
    const compare = [
      'hello',
      'world',
      'hello my',
      'honey'
    ];
    const ware = warewolf(

      (req, res, next) => {
        req.locals.push(compare[0]);
        next();
      },
      (req, res, next) => {
        req.locals.push(compare[1]);
        next();
      },
      [
        (req, res, next) => {
          req.locals.push(compare[2]);
          next();
        },
        (req, res, next) => {
          req.locals.push(compare[3]);
          next();
        },
      ],
      (_req) => {
        assert.deepEqual(_req.locals, compare, 'Locals not equal');
      }
    );
    ware(req, res, noop);
  });

  it('should use done', () => {
    const req = {locals: []};
    const res = {};
    const compare = 'foo';
    const compare2 = 'bar';
     const ware = warewolf(

      (req, res, next) => {
        next();
      },
      (req, res, next) => {
        next();
      },
      [
        (req, res, next) => {
          next();
        },
        (req, res, next) => {
          next();
        },
      ],
       (_req, res, done) => {
         done(null, compare, compare2);
       }
    );
    ware(req, res, (err, _compare, _compare2) => {
      assert.deepEqual(_compare, compare, 'Done not equal');
      assert.deepEqual(_compare2, compare2, 'Done2 not equal');
    });
  });

});
