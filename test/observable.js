var assert = require('assert'),
    observ = require('../src/observable');

describe('observable', function () {
    describe('Observable', function () {
        it('establishes basic sub/pub pattern', function () {
            var observable = new observ.Observable(),
                results = [];

            observable.sub('name', function (newVal, val) {
                results.push(['first cb', newVal, val]);
            });
            observable.sub('name', function (newVal, val) {
                results.push(['second cb', newVal, val]);
            });
            observable.pub('name', 'spring', 'winter');

            assert.deepEqual(results, [
                ['first cb', 'spring', 'winter'],
                ['second cb', 'spring', 'winter']
            ]);
        });
    });

    describe('ObservableArray', function () {
        it('simulates native array in-place methods', function () {
            var observableArr = new observ.ObservableArray([1, 2, 3]),
                operations = [],
                clear = function () {
                    operations = [];
                };

            observableArr.sub('add', function (val, index) {
                operations.push(['add', val, index]);
            });
            observableArr.sub('remove', function (val, index) {
                operations.push(['remove', val, index]);
            });

            // push
            observableArr.push(4, 5);
            assert.deepEqual(operations, [
                ['add', 4, 3],
                ['add', 5, 4]
            ]);
            clear();

            // pop
            observableArr.pop();
            observableArr.pop();
            assert.deepEqual(operations, [
                ['remove', 5, 4],
                ['remove', 4, 3]
            ]);
            clear();

            // unshift
            observableArr.unshift(-1, 0);
            assert.deepEqual(operations, [
                ['add', -1, 0],
                ['add', 0, 1]
            ]);
            clear();

            // shift
            observableArr.shift();
            observableArr.shift();
            assert.deepEqual(operations, [
                ['remove', -1, 0],
                ['remove', 0, 0]
            ]);
            clear();

            // reverse
            observableArr.reverse();
            assert.deepEqual(operations, [
                ['remove', 1, 0],
                ['remove', 2, 0],
                ['add', 2, 1],
                ['add', 1, 2]
            ]);
            clear();

            // sort
            observableArr.sort(function (x, y) {
                return x - y;
            });
            assert.deepEqual(operations, [
                ['remove', 3, 0],
                ['remove', 2, 0],
                ['add', 2, 1],
                ['add', 3, 2]
            ]);
            clear();

            // splice
            observableArr.splice(1, 2);
            observableArr.splice(1, 0, 2, 3);
            assert.deepEqual(operations, [
                ['remove', 2, 1],
                ['remove', 3, 1],
                ['add', 2, 1],
                ['add', 3, 2],
            ]);
            clear();
        });

        it('retrieves underlaying native array by peek method', function () {
            var arr = [1, 2, 3],
                observableArr = new observ.ObservableArray(arr);

            assert.equal(observableArr.peek(), arr);

            observableArr.pop();
            assert.equal(observableArr.peek(), arr);
            assert.deepEqual(observableArr.peek(), [1, 2]);
        });

        it('retrieves underlaying origin array by unwrap method', function () {
            var arr = [1, 2, 3, { name: 'spring' }, [4, 5]],
                map = { name: 'spring', points: [60, 80, 100] },
                observableArr = new observ.ObservableArray(arr),
                observableMap = new observ.ObservableMap(map);

            assert.equal(observableArr.unwrap(), arr);
            assert.deepEqual(observableArr.unwrap(), [1, 2, 3, { name: 'spring' }, [4, 5]]);

            assert.deepEqual(observableMap.unwrap(), { name: 'spring', points: [60, 80, 100] });
        });

        it('should not wrap non-plain object to ObservableMap', function () {
            var observableArr = new observ.ObservableArray([1, 2, new Date()]);
            assert(!(observableArr.peek()[2] instanceof observ.ObservableMap));
        });
    });

    describe('ObservableMap', function () {
        it('accesses properties through getter and setter', function () {
            var observableMap = new observ.ObservableMap({ name: 'spring', age: 23 }),
                results = [],
                handle;

            // get
            assert.equal(observableMap.get('name'), 'spring');
            assert.equal(observableMap.get('age'), 23);

            // set and sub
            handle = observableMap.sub('name', function (newVal, val) {
                results.push([newVal, val]);
            });
            observableMap.set('name', 'vivid');
            assert.deepEqual(results, [['vivid', 'spring']]);

            // detach
            handle.detach();
            observableMap.set('name', 'spring');
            assert.deepEqual(results, [['vivid', 'spring']]);
        });

        it('retrieves all properties by peek method', function () {
            var observableMap = new observ.ObservableMap({ name: 'spring', age: 23 });

            assert.deepEqual(observableMap.peek(), { name: 'spring', age: 23 });
        });

        it('converts objects to ObservableMap or ObservableArray', function () {
            var observableMap = new observ.ObservableMap({
                    name: 'spring',
                    tags: ['engineer', 'front-end', 'father'],
                    points: {
                        'javascript': 60,
                        'html': 60,
                        'css': 60
                    }
                }),
                tags = observableMap.get('tags'),
                points = observableMap.get('points');

            assert(tags instanceof observ.ObservableArray);
            assert(points instanceof observ.ObservableMap);

            // access parent scope
            assert.equal(tags.scope, observableMap);
            assert.equal(points.parent, observableMap);
        });

        // TODO cross scope computed property
        it('supports computed property', function () {
            var observableMap = new observ.ObservableMap({
                price: 5,
                count: 0,
                amount: observ.computed(function () {
                    return this.get('price') * this.get('count');
                })
            });

            assert.equal(observableMap.get('amount'), 0);
            observableMap.set('count', observableMap.get('count') + 1);
            assert.equal(observableMap.get('amount'), 5);
            observableMap.set('price', 10);
            assert.equal(observableMap.get('amount'), 10);
        });

        it('supports recursive computed property', function () {
            var count = 0,
                person = new observ.ObservableMap({
                    firstName: 'chun',
                    lastName: 'shang',
                    fullName: observ.computed({
                        get: function () {
                            return this.get('firstName') + ' ' + this.get('lastName');
                        },
                        set: function (newVal) {
                            var chips = newVal.split(' ');
                            this.set('firstName', chips[0]);
                            this.set('lastName', chips[1]);
                        }
                    }),
                    street: 'wangjing east road, chaoyang, beijing',
                    address: observ.computed(function () {
                        return this.get('fullName') + ', ' + this.get('street');
                    })
                });

            person.sub('fullName', function () {
                count++;
            });

            assert.equal(person.get('fullName'), 'chun shang');
            assert.equal(person.get('address'),
                'chun shang, wangjing east road, chaoyang, beijing');
            person.set('firstName', 'vivid');
            assert.equal(person.get('fullName'), 'vivid shang');
            assert.equal(person.get('address'),
                'vivid shang, wangjing east road, chaoyang, beijing');
            assert.equal(count, 1);

            person.set('fullName', 'vivid fe');
            assert.equal(person.get('firstName'), 'vivid');
            assert.equal(person.get('lastName'), 'fe');
            // TODO add sleep time for setter change dependent properties
            assert.equal(count, 3);
        });

        it('supports conditional computed property', function () {
            // getter/setter
            var count = 0,
                condition = true,
                computed = new observ.ObservableMap({
                    first: 'A',
                    last: 'B',
                    full: observ.computed(function () {
                        count++;
                        return condition ? this.get('first') : this.get('last');
                    })
                });

            assert.equal(computed.get('full'), 'A');
            assert.equal(count, 1);
            computed.set('last', 'B2');
            assert.equal(computed.get('full'), 'A');
            assert.equal(count, 2);

            condition = false;
            assert.equal(computed.get('full'), 'B2');
            assert.equal(count, 3);
        });

        it('should not wrap non-plain object to ObservableMap', function () {
            var observableMap = new observ.ObservableMap({
                date: new Date()
            });
            assert(!(observableMap.get('date') instanceof observ.ObservableMap));
        });
    });
});
