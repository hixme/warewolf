import { assert } from 'chai';
import warewolf, { mergerware } from '../src/index';

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
    ware();
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
    ware();
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
    ware();
    assert.deepEqual(item, compare, 'Item not equal');
  });

  it('should exit on error', () => {
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

  it('should exit on throw', () => {
    const ware = warewolf(
      [
        () => {
          throw 'error';
        },
        (next) => {
          assert.fail('Should not resolve');
          next();
        },
      ]
    );
    ware(err => assert.isOk(err === 'error', 'Error not equal'));
  });

  it('should not stack overflow', done => {

    const ware = warewolf(
      [
        (next) => {
          next();
        },
      ]
    );
    assert.throws(() => ware(() => {
      done();
      throw 'error';
    }));

  });

  it('should throw on final ware throw', () => {
    const ware = warewolf(
      [
        () => {
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
      ware();
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
      ware();
      setTimeout(() => {
        assert.isOk(true);
        done();
      }, 10);
    });
  });

  describe('promises', () => {
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

    it('should support errors', done => {
      function next(cb) {
        return cb('error');
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

    it('should support throws', done => {
      function next(cb) {
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
      ware();
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
    ware(req, res);
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

    const ware = warewolf(ware1, ware2);

    ware(req, res);
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
    ware(req, res);
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

  it('should merge an object', () => {
    const compare = {
      item1: 'hello',
      item2: 'world'
    };
    const ware = mergerware(Object.assign)(

      (next) => {
        next(null, {
          item1: 'hello'
        });
      },
      (next) => {
        next(null, {
          item2: 'world'
        });
      },
      (model, done) => {
        done(null, model);
      }
    );
    ware((err, model) => {
      assert.deepEqual(model, compare, 'Waterfall not equal');
    });
  });

});
