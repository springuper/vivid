'use strict';

var util = require('./util'),
    dom = require('./dom'),
    env = require('./env'),
    observable = require('./observable'),
    VHandlebars = require('./compiler'),

    ATTR_PREFIX = env.constants.ATTR_PREFIX,
    noop = function () {};

function Binding(scope, property, options) {
    this.id = env.id++;
    Binding.instances[this.id] = this;

    this.scope = scope;
    this.property = property;
    this.el = null;
    this.options = options;

    this.observableHandles = [];

    // reverse references
    scope.bindings = scope.bindings || {};
    scope.bindings[property] = scope.bindings[property] || [];
    scope.bindings[property].push(this);
}
Binding.instances = {};
Binding.DEFAULT_ACTION = {
    hook: function () {
        return new VHandlebars.SafeString(' ' + ATTR_PREFIX + this.id);
    },
    bind: noop,
    unbind: noop,
    update: noop,
    publish: function () {
        this.scope.set(this.property, this.el.value);
    }
};
Binding.prototype.mix = function (o) {
    var instance = this;
    util.each(o, function (fn, method) {
        // NOTE ensure actions are executed under Binding context
        instance[method] = util.bind(fn, instance);
    });
    util.mix(instance, Binding.DEFAULT_ACTION, false, instance);
};
Binding.prototype.setup = function (el) {
    var instance = this,
        subDependency = function (fn, scope) {
            var properties = observable.detectDependency(fn, scope).deps,
                handles = [];
            util.each(properties, function (property) {
                handles.push(scope.sub(property, util.bind(fn, scope)));
            });
            return handles;
        },
        glue = function (v, k) {
            var scope = instance.scope,
                observableHandles = instance.observableHandles,
                onchanged = function () {
                    var val = scope.get(v);
                    instance.update(el, val, k || v);
                    return val;
                };
            util.pushArray(observableHandles, subDependency(onchanged, scope));
        };

    instance.el = el;
    instance.bind(el);
    if (instance.property) {
        glue(instance.property);
    } else if (instance.multi) {
        util.each(instance.options.hash, glue);
    }
};

function scan(el, fn) {
    util.each(util.makeArray(el.attributes), function (attr) {
        var key = attr.name;
        if (key.indexOf(ATTR_PREFIX) !== 0) return;
        fn(+(key.substring(ATTR_PREFIX.length)));
    });
}
function render(source, scope) {
    var template = typeof source === 'string' ? VHandlebars.compile(source) : source,
        frag = document.createDocumentFragment(),
        container,
        child,
        hookupEls = [];

    if (util.isPlainObject(scope) &&
        !(scope instanceof observable.ObservableMap)) {
        scope = new observable.ObservableMap(scope);
    }
    container = dom.toDOM(template(scope));
    while (true) {
        child = container.firstChild;
        if (!child) break;

        frag.appendChild(child);
        if (child.nodeType === 1) {
            hookupEls.push(child);
            util.pushArray(hookupEls,
                    util.makeArray(child.getElementsByTagName('*')));
        }
    }
    util.each(hookupEls, function (el) {
        scan(el, function (id) {
            Binding.instances[id].setup(el);
        });
    });

    return frag;
}
function unbind(el) {
    if (el.nodeType !== 1) return;
    scan(el, function (id) {
        var binding = Binding.instances[id],
            observableHandles = binding.observableHandles;
        binding.unbind(binding.el);
        while (observableHandles.length) {
            observableHandles.pop().detach();
        }
    });
    util.each(util.makeArray(el.childNodes), function (child) {
        unbind(child);
    });
}

module.exports = {
    Binding: Binding,
    render: render,
    unbind: unbind
};
