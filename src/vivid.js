'use strict';

var binding = require('./binding'),
    observable = require('./observable'),
    binder = require('./binder');

module.exports = {
    Scope: observable.ObservableMap,
    computed: observable.computed,
    render: binding.render,
    unbind: binding.unbind,
    register: binder.register,
    unregister: binder.unregister
};
