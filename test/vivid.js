var assert = require('assert'),
    vivid = require('../src/vivid');

describe('vivid', function () {
    var el;
    beforeEach(function () {
        el = document.createElement('div');
        document.body.appendChild(el);
    });

    it('renders according to specific data', function () {
        var tpl = 'Hello, {{name}}.',
            data = {
                name: 'vivid'
            };
        el.appendChild(vivid.render(tpl, data));

        assert.equal(el.innerText, 'Hello, vivid.');
    });

    it('binds mustache binding to scope data', function () {
        var tpl = 'Hello, {{name}}.',
            scope = new vivid.Scope({
                name: 'vivid'
            });
        el.appendChild(vivid.render(tpl, scope));
        assert.equal(el.innerText, 'Hello, vivid.');
        scope.set('name', 'world');
        assert.equal(el.innerText, 'Hello, world.');

        // unbind
        vivid.unbind(el);
        scope.set('name', 'vivid');
        assert.equal(el.innerText, 'Hello, world.');
    });

    afterEach(function () {
        el.parentNode.removeChild(el);
    });
});
