'use strict';

var util = require('./util'),
    env = require('./env');

/**
 * reserve observable data to detach
 * @class ObservableHandle
 * @param {Observable} observable
 * @param {String} attr
 * @param {Function} sub
 */
function ObservableHandle(observable, attr, sub) {
    this.observable = observable;
    this.attr = attr;
    this.sub = sub;
}
/**
 * detach subscriber
 */
ObservableHandle.prototype.detach = function () {
    var subs = this.observable.subs[this.attr],
        index = util.indexOf(subs, this.sub);
    if (index > -1) subs.splice(index, 1);
    if (!subs.length) delete this.observable.subs[this.attr];
};

/**
 * Observable for property change
 * @class Observable
 */
function Observable() {
    this.subs = {};
}
/**
 * add subscriber for property change
 * @param {String} attr
 * @param {Function} fn
 */
Observable.prototype.sub = function (attr, fn) {
    var subs = this.subs[attr];
    if (!subs) subs = this.subs[attr] = [];
    subs.push(fn);
    return new ObservableHandle(this, attr, fn);
};
/**
 * pub change msg to subs
 * @param {String} attr
 * @param {Any} newVal
 * @param {Any} val
 */
Observable.prototype.pub = function (attr, newVal, val) {
    var subs = this.subs[attr];
    if (!subs) return;
    util.each(subs, function (fn) {
        fn.call(this, newVal, val);
    });
};
/**
 * an abstract method to supply a way to retrieve internal value
 */
Observable.prototype.peek = function () {
    throw new Error('Extended class must implement this method.');
};
/**
 * recursively unwrap internal value
 * @return {Any}
 */
Observable.prototype.unwrap = function () {
    var origin = this.peek();
    util.each(origin, function (val, index) {
        if (val instanceof Observable) {
            val = val.unwrap();
        }
        origin[index] = val;
    });
    return origin;
};

/**
 * encapsulate array to observe item changes
 * @class ObservableArray
 * @param {Array} arr
 * @param {ObservableMap} [scope]
 */
function ObservableArray(arr, scope) {
    ObservableArray.superclass.constructor.call(this);

    this.scope = scope;
    this.arr = arr;
    this.length = arr.length;
    this.setup();
}
util.extend(ObservableArray, Observable);
/**
 * add basic methods and wrap items
 */
ObservableArray.prototype.setup = function () {
    var instance = this,
        underlayingArray = instance.arr,
        proto = ObservableArray.prototype;

    util.each(['push', 'pop', 'shift', 'unshift', 'splice', 'reverse', 'sort'], function (method) {
        proto[method] = function () {
            var arr = this.peek(),
                oldArr = arr.concat(),
                diff,
                ret;
            ret = arr[method].apply(arr, util.makeArray(arguments));
            diff = util.computeArrayDiff(oldArr, arr);
            this.flush(diff);
            return ret;
        };
    });

    util.each(underlayingArray, function (item, index) {
        underlayingArray[index] = instance.wrap(item);
    });
};
/**
 * wrap origin item to Observable
 * @return {ObservableArray|ObservableMap|Any}
 */
ObservableArray.prototype.wrap = function (value) {
    var scope = this.scope,
        wrapper = value;
    if (util.isArray(value)) {
        wrapper = new ObservableArray(value, scope);
    } else if (util.isPlainObject(value)) {
        wrapper = new ObservableMap(value, scope);
    }
    return wrapper;
};
/**
 * add subscriber for item change
 * @param {String} type currently only 'add' and 'remove'
 * @param {Function} fn
 */
ObservableArray.prototype.sub = function (type, fn) {
    var subs = this.subs[type];
    if (!subs) subs = this.subs[type] = [];
    subs.push(fn);
    return new ObservableHandle(this, type, fn);
};
/**
 * pub change msg to subs
 * @param {String} type currently only 'add' and 'remove'
 * @param {Array} items
 * @param {Number} index
 */
ObservableArray.prototype.pub = function (type, items, index) {
    util.each(this.subs[type] || [], function (sub) {
        sub(items, index);
    });
};
/**
 * retrieve internal array
 * @return {Array}
 */
ObservableArray.prototype.peek = function () {
    return this.arr;
};
/**
 * flush change msgs
 * @param {Array} diff
 */
ObservableArray.prototype.flush = function (diff) {
    var instance = this,
        underlayingArray = instance.arr;
    util.each(diff, function (operation) {
        var status = operation.status,
            value = operation.value,
            index = operation.index;
        if (status === 'add') {
            value = instance.wrap(value);
            underlayingArray[index] = value;
        }
        instance.pub(status, value, index);
    });
};
/**
 * remove specific item
 * @param {Any} item
 * @return {Any}
 */
ObservableArray.prototype.remove = function (item) {
    var index = this.arr.indexOf(item);
    return index > -1 ? this.splice(index, 1) : null;
};

/**
 * encapsulate object to observe property changes
 * @class ObservableMap
 * @param {Object} o
 * @param {ObservableMap} [parent]
 */
function ObservableMap(o, parent) {
    ObservableMap.superclass.constructor.call(this);

    this.id = ++env.id;
    ObservableMap.instances[this.id] = this;
    // pointer to parent scope
    this.parent = parent || null;

    // data
    this.properties = {};
    this.descriptors = {};
    var map = this;
    util.each(o, function (value, property) {
        if (value instanceof Descriptor) {
            map.setDescriptor(property, value);
        } else {
            map.set(property, value, true);
        }
    });
}
ObservableMap.instances = {};
util.extend(ObservableMap, Observable);
/**
 * get property value
 * @param {String} property
 * @return {Any}
 */
ObservableMap.prototype.get = function (property) {
    var record = env.stack[env.stack.length - 1];
    // mark property retrieved
    if (record) {
        record[property] = 1;
    }
    return this.descriptors[property] ?
        this.descriptors[property].get() :
        this.properties[property];
};
/**
 * set property a new value
 * @param {String} property
 * @param {Any} newVal
 * @param {Boolean} [silent]
 * @return {Any} the new value
 */
ObservableMap.prototype.set = function (property, newVal, silent) {
    var properties = this.properties,
        descriptors = this.descriptors,
        value;

    if (descriptors[property]) {
        return descriptors[property].set(newVal);
    }

    if (util.isArray(newVal)) {
        newVal = new ObservableArray(newVal, this);
    } else if (util.isPlainObject(newVal)) {
        newVal = new ObservableMap(newVal, this);
    }
    value = properties[property];
    if (newVal !== value) {
        properties[property] = newVal;
        if (!silent) {
            this.pub(property, newVal, value);
        }
    }
    return newVal;
};
/**
 * set property a new descriptor
 * @param {String} property
 * @param {Descriptor} descriptor
 * @return {Descriptor}
 */
ObservableMap.prototype.setDescriptor = function (property, descriptor) {
    descriptor.setup(this, property);
    this.descriptors[property] = descriptor;
    return descriptor;
};
/**
 * get descriptor associated with specific property
 * @param {String} property
 * @return {Descriptor}
 */
ObservableMap.prototype.getDescriptor = function (property) {
    return this.descriptors[property];
};
/**
 * retrieve internal map
 * @return {Object}
 */
ObservableMap.prototype.peek = function () {
    return this.properties;
};

/*
 * Descriptor for computed property
 * @class Descriptor
 */
function Descriptor() {
    this.getter = null;
    this.setter = null;
    this.scope = null;
    this.deps = [];
    this.property = '';
    this.value = null;
    this.updater = null;
    this.handles = {};
}
/**
 * setup descriptor, mainly including subing dependent keys
 * @param {Object} scope
 * @param {String} property
 */
Descriptor.prototype.setup = function (scope, property) {
    var instance = this;
    instance.scope = scope;
    instance.property = property;
    instance.updater = function (newVal, value) {
        newVal = typeof newVal === 'undefined' ? scope.get(property) : newVal;
        value = typeof value === 'undefined' ? instance.value : value;
        if (newVal !== value) {
            scope.pub(property, newVal, value);
            instance.value = newVal;
        }
    };
};
/**
 * get property value
 * @return {Any}
 */
Descriptor.prototype.get = function () {
    var info = detectDependency(this.getter, this.scope);
    this.replaceDependency(info.deps);
    return info.value;
};
/**
 * set new value to computed property
 * @param {Any} newVal
 * @return {Any}
 */
Descriptor.prototype.set = function (newVal) {
    var value = this.value;
    if (newVal !== value) {
        this.setter.call(this.scope, newVal, value);
        this.updater(newVal, value);
        this.value = newVal;
    }
    return newVal;
};
/**
 * update subscribers to listen new dependencies
 * @param {Array} newDeps
 */
Descriptor.prototype.replaceDependency = function (newDeps) {
    var instance = this,
        deps = instance.deps,
        handles = instance.handles,
        i, len, pos;

    for (i = 0, len = deps.length; i < len; ++i) {
        pos = util.indexOf(newDeps, deps[i]);
        if (pos === -1) continue;
        deps.splice(i--, 1);
        len--;
        newDeps.splice(pos, 1);
    }
    util.each(deps, function (dep) {
        handles[dep].detach();
        delete handles[dep];
    });
    util.each(newDeps, function (dep) {
        handles[dep] = instance.scope.sub(dep, function () {
            instance.updater();
        });
    });

    instance.deps = newDeps;
};
/**
 * create a computed property
 * @param {Function|Object} o
 * @return {Descriptor}
 */
function computed(o) {
    var descriptor = new Descriptor();

    if (typeof o === 'function') {
        descriptor.getter = o;
    } else {
        descriptor.getter = o.get;
        descriptor.setter = o.set;
    }

    return descriptor;
}
/**
 * detect all dependencies of fn
 * @param {Function} fn
 * @param {ObservableMap} scope
 * @return {Object}
 */
function detectDependency(fn, scope) {
    var value;
    env.stack.push({});
    value = fn.call(scope);
    return {
        value: value,
        deps: util.keys(env.stack.pop())
    };
}

module.exports = {
    Observable: Observable,
    ObservableArray: ObservableArray,
    ObservableMap: ObservableMap,
    computed: computed,
    detectDependency: detectDependency
};
