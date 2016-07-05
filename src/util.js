'use strict';

var arr = [],
    slice = arr.slice,
    push = arr.push,
    toString = Object.prototype.toString,
    hasOwn = Object.prototype.hasOwnProperty;

var util = {
    each: function (collection, iterator) {
        var p, i, len;
        if (util.isArray(collection)) {
            if (collection.forEach) {
                collection.forEach(iterator);
            } else {
                for (i = 0, len = collection.length; i < len; ++i) {
                    iterator(collection[i], i, collection);
                }
            }
        } else {
            for (p in collection) {
                if (collection.hasOwnProperty(p)) {
                    iterator(collection[p], p, collection);
                }
            }
        }
    },
    some: function (arr, fn) {
        var ret,
            i, len;
        for (i = 0, len = arr.length; i < len; ++i) {
            ret = fn(arr[i], i);
            if (ret) return ret;
        }
    },
    keys: Object.keys || function (o) {
        var keys = [];
        util.each(o, function (value, key) {
            keys.push(key);
        });
        return keys;
    },
    mix: function (r, s, overwrite, context) {
        util.each(s, function (v, k) {
            if (!r[k] || overwrite) {
                r[k] = context ? util.bind(s[k], context) : s[k];
            }
        });
    },
    indexOf: function (arr, item) {
        var i, len;
        if (arr.indexOf) return arr.indexOf(item);
        for (i = 0, len = arr.length; i < len; ++i) {
            if (arr[i] === item) return i;
        }
        return -1;
    },
    isArray: Array.isArray || function (o) {
        return toString.call(o) === '[object Array]';
    },
    isPlainObject: function (o) {
        return toString.call(o) === '[object Object]' &&
                o.constructor &&
                hasOwn.call(o.constructor.prototype, 'hasOwnProperty');
    },
    makeArray: function (list) {
        try {
            return slice.call(list, 0);
        } catch(ex) {
            var ret = [],
                i, len;
            for (i = 0, len = list.length; i < len; ++i) {
                ret.push(list[i]);
            }
            return ret;
        }
    },
    pushArray: function (arr, list) {
        push.apply(arr, list);
    },
    create: Object.create || function (o) {
        var F = function () {};
        F.prototype = o;
        return new F();
    },
    extend: function (r, s) {
        var sp = s.prototype,
            rp = util.create(sp);
        r.prototype = rp;
        rp.constructor = r;
        r.superclass = sp;
        return r;
    },
    bind: function (fn, context) {
        var args = util.makeArray(arguments).slice(2);
        return function () {
            return fn.apply(context, args.concat(util.makeArray(arguments)));
        };
    },
    sprintf: function () {
        var args = util.makeArray(arguments),
            tpl = args.shift();
        return tpl.replace(/%s/g, function () {
            return args.shift() || '';
        });
    },
    /**
     * compute operations for changing oldArr to newArr
     * TODO use modified levenshtein distance https://github.com/knockout/knockout/pull/259
     * @param {Array} oldArr
     * @param {Array} newArr
     * @return {Object[]}
     */
    computeArrayDiff: function (oldArr, newArr) {
        var i, j,
            oldLen = oldArr.length, newLen = newArr.length,
            distanceMatrix = [[]],
            distance,
            diff = [],
            pushDiff = function (status, value, index) {
                diff.push({ status: status, value: value, index: index });
            };

        // init matrix
        for (i = 0; i <= oldLen; ++i) distanceMatrix[i] = [i];
        for (j = 1; j <= newLen; ++j) distanceMatrix[0][j] = j;

        // build matrix
        for (j = 1; j <= newLen; ++j) {
            for (i = 1; i <= oldLen; ++i) {
                if (oldArr[i - 1] === newArr[j - 1]) {
                    distanceMatrix[i][j] = distanceMatrix[i - 1][j - 1];
                } else {
                    distanceMatrix[i][j] = 1 + Math.min(
                        distanceMatrix[i - 1][j],
                        distanceMatrix[i][j - 1]
                    );
                }
            }
        }

        // compute diff
        for (i = oldLen, j = newLen; i || j;) {
            distance = distanceMatrix[i][j];
            if (j && distanceMatrix[i][j - 1] === distance - 1) { // horizontal
                pushDiff('add', newArr[j - 1], j - 1);
                j--;
            } else if (i && distanceMatrix[i - 1][j] === distance - 1) { // vertical
                pushDiff('remove', oldArr[i - 1], j);
                i--;
            } else {
                i--;
                j--;
            }
        }

        return diff.reverse();
    }
};

module.exports = util;
