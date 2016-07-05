var assert = require('assert'),
    util = require('../src/util');

describe('util', function () {
    describe('#sprintf', function () {
        it('formats variables according to the template', function () {
            assert.equal(util.sprintf('Hello, %s.', 'world'), 'Hello, world.');
            assert.equal(util.sprintf('%s is here, but %s isn\'t.', 'foo', 'bar'),
                'foo is here, but bar isn\'t.');
        });
    });

    describe('#isPlainObject', function () {
        it('recognizes direct instance of Object', function () {
            assert.equal(util.isPlainObject({}), true);
            assert.equal(util.isPlainObject(new Date()), false);
        });
    });

    describe('#computeArrayDiff', function () {
        it('compute the operations from old array to new one', function () {
            assert.deepEqual(util.computeArrayDiff([1], [1, 2]), [{
                status: 'add',
                value: 2,
                index: 1
            }]);

            assert.deepEqual(util.computeArrayDiff([1, 2], [1]), [{
                status: 'remove',
                value: 2,
                index: 1
            }]);

            assert.deepEqual(util.computeArrayDiff([1], [2]), [{
                status: 'remove',
                value: 1,
                index: 0
            }, {
                status: 'add',
                value: 2,
                index: 0
            }]);
        });
    });
});
