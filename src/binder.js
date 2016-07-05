'use strict';

var dom = require('./dom'),
    util = require('./util'),
    env = require('./env'),
    binding = require('./binding'),
    observable = require('./observable'),
    VHandlebars = require('./compiler'),

    SafeString = VHandlebars.SafeString,
    PLACEHOLDER_TAG_TPL = '<script type="text/x-placeholder" style="display:none" %s></script>',
    ATTR_PREFIX = env.constants.ATTR_PREFIX,

    helpers = {};

function register(name, action) {
    helpers[name] = function (context, options) {
        var helperBinding;
        if (!(this instanceof observable.ObservableMap)) {
            // directly use non ObservableMap type
            return this;
        }

        if (!options) {
            options = context;
            context = undefined;
        }
        helperBinding = new binding.Binding(this, context, options);
        helperBinding.mix(action);
        return helperBinding.hook();
    };
    VHandlebars.registerHelper(name, helpers[name]);
}
function unregister(name) {
    if (helpers.hasOwnProperty(name)) {
        delete helpers[name];
        VHandlebars.unregisterHelper(name);
    }
}

VHandlebars.registerHelper('text', function (name) {
    return this.get(name);
});

/**
 * bind helper
 * Example:
 * <h1>{{title}}</h1>
 */
register('bind', {
    hook: function () {
        this.$nodes = null;
        return new SafeString(util.sprintf(
                PLACEHOLDER_TAG_TPL, ATTR_PREFIX + this.id));
    },
    update: function (el, val) {
        this.$nodes = dom.replace(el, val || '', this.$nodes);
    }
});

/**
 * attr helper
 * Example:
 * <a {{attr href=url title=name}}>{{name}}</a>
 */
register('attr', {
    multi: true,
    update: function (el, value, name) {
        el.setAttribute(name, value);
    }
});

/**
 * action helper, used to bind dom events
 * Example:
 * {{action click=methodName}}
 */
register('action', {
    multi: true,
    hook: function () {
        this.$domEventHandles = [];
        return new SafeString(' ' + ATTR_PREFIX + this.id);
    },
    update: function (el, method, event) {
        var scope = this.scope,
            domEventHandles = this.$domEventHandles,
            fn = function (e) {
                var ret = method.call(scope, e);
                if (ret === false) {
                    if (e.preventDefault) {
                        e.preventDefault();
                    } else {
                        e.returnValue = false;
                    }
                }
            };

        // detach
        // why need detach ???
        util.some(domEventHandles, function (handle, index) {
            if (handle.event === event) {
                domEventHandles.splice(index, 1);
                dom.off(el, handle.event, handle.fn);
                return true;
            }
        });

        // attach
        dom.on(el, event, fn);
        domEventHandles.push({ event: event, fn: fn });
    },
    unbind: function (el) {
        var domEventHandles = this.$domEventHandles,
            handle;
        while (domEventHandles.length) {
            handle = domEventHandles.pop();
            dom.off(el, handle.event, handle.fn);
        }
    }
});

/**
 * if helper
 * Example:
 * {{#if condition}}...{{else}}...{{/if}}
 */
register('if', {
    hook: function () {
        this.$nodes = null;
        this.$condition = undefined;
        return new SafeString(util.sprintf(
                PLACEHOLDER_TAG_TPL, ATTR_PREFIX + this.id));
    },
    update: function (el, condition) {
        var template,
            nodes;
        condition = !!condition;
        if (condition === this.$condition) return;

        this.$condition = condition;
        template = condition ? this.options.fn : this.options.inverse;
        nodes = util.makeArray(binding.render(template, this.scope).childNodes);
        this.$nodes = dom.replace(el, nodes, this.$nodes);
    }
});

/**
 * each helper
 * Example:
 * {{#each collection}}...{{/each}}
 */
register('each', {
    hook: function () {
        this.$modelId = 0;
        this.$modelStore = [];
        return new SafeString(util.sprintf(
                PLACEHOLDER_TAG_TPL, ATTR_PREFIX + this.id));
    },
    bind: function () {
        var observableArr = this.scope.get(this.property),
            addHandle = observableArr.sub('add', this.$add),
            removeHandle = observableArr.sub('remove', this.$remove);
        this.observableHandles.push(addHandle, removeHandle);
    },
    update: function (el, collection) {
        this.$remove();
        this.$add(collection.peek());
    },
    $lookup: function (model) {
        var modelStore = this.$modelStore,
            m;

        util.some(modelStore, function (item) {
            if (item.model === model) {
                m = item;
                return true;
            }
        });
        if (!m) {
            m = {
                id: this.$modelId++,
                model: model,
                nodes: null
            };
            modelStore.push(m);
        }

        return m;
    },
    $add: function (models, index) {
        var i,
            model,
            nodes,
            wrapper;

        models = util.isArray(models) ? models : [models];
        index = index || 0;
        i = models.length;
        while (i--) {
            model = models[i];
            nodes = util.makeArray(binding.render(this.options.fn, model).childNodes);
            wrapper = this.$lookup(model);
            wrapper.nodes = nodes;
            dom.insertAfter(nodes, this.el);
        }
    },
    $remove: function (model) {
        var instance = this,
            modelStore = instance.$modelStore;

        if (model) {
            util.some(modelStore, function (wrapper, index) {
                if (wrapper.model === model) {
                    dom.remove(wrapper.nodes);
                    modelStore.splice(index, 1);
                    return true;
                }
            });
        } else {
            while (modelStore.length) {
                dom.remove(modelStore.pop().nodes);
            }
        }
    }
});

/**
 * value helper
 * Example:
 * <input name="username" {{value username}} />
 */
register('value', {
    bind: function (el) {
        dom.on(el, 'change', this.publish);
    },
    unbind: function (el) {
        dom.off(el, 'change', this.publish);
    },
    update: function (el, value) {
        var tag = el.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea') {
            el.value = value;
        } else if (tag === 'select') {
            var selection = -1;
            for (var i = 0, n = el.options.length, optionValue; i < n; ++i) {
                optionValue = el.options[i].value;
                if (optionValue === ('' + value) || (optionValue === '' && value === undefined)) {
                    selection = i;
                    break;
                }
            }
            el.selectedIndex = selection;
        }
    }
});

/**
 * enabled && disabled helper
 * Example:
 * <input {{disabled inputVal}} />
 */
register('disabled', {
    update: function (el, value) {
        el.disabled = value;
    }
});
register('enabled', {
    update: function (el, value) {
        el.disabled = !value;
    }
});

/**
 * show && hide helper
 */
register('show', {
    update: function (el, value) {
        el.style.display = value ? '' : 'none';
    }
});
register('hide', {
    update: function (el, value) {
        el.style.display = value ? 'none' : '';
    }
});

/**
 * checked && unchecked
 */
register('checked', {
    bind: function (el) {
        dom.on(el, 'change', this.publish);
    },
    unbind: function (el) {
        dom.off(el, 'change', this.publish);
    },
    update: function (el, value) {
        el.checked = value;
    },
    publish: function () {
        this.scope.set(this.property, this.el.checked);
    }
});

register('unchecked', {
    bind: function (el) {
        dom.on(el, 'change', this.publish);
    },
    unbind: function (el) {
        dom.off(el, 'change', this.publish);
    },
    update: function (el, value) {
        el.checked = !value;
    },
    publish: function () {
        this.scope.set(this.property, !this.el.checked);
    }
});

/**
 * class helper
 * Example:
 * <div {{class className1=c1 className2=c2}}>
 * c1=true,c2=false => <div class="className1">
 */
register('class', {
    multi: true,
    update: function (el, value, name) {
        if (value) dom.addClass(el, name);
        else dom.removeClass(el, name);
    }
});

/**
 * valuechange helper
 * just like value helper, it provides instant updates from DOM for user input
 */
register('valuechange', {
    bind: function (el) {
        var events = ['keyup', 'keydown', 'change'];
        dom.on(el, events, this.publish);
    },
    unbind: function (el) {
        var events = ['keyup', 'keydown', 'change'];
        dom.off(el, events, this.publish);
    },
    update: function (el, value) {
        el.value = value;
    }
});

module.exports = {
    register: register,
    unregister: unregister
};
