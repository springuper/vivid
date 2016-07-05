'use strict';

var assert = require('assert'),
    binding = require('../src/binding'),
    binder = require('../src/binder'),
    observable = require('../src/observable'),
    Scope = observable.ObservableMap,
    Simulate = require('simulate'),
    dom = require('../src/dom');

describe('binder', function () {
    describe('text helper', function () {
        var el;
        beforeEach(function () {
            el = document.createElement('div');
            document.body.appendChild(el);
        });

        it('just renders property value', function () {
            var tpl = 'Hello, {{text name}}.',
                scope = new Scope({
                    name: 'vivid'
                });
            el.appendChild(binding.render(tpl, scope));

            assert.equal(el.innerText, 'Hello, vivid.');
            scope.set('name', 'world');
            assert.equal(el.innerText, 'Hello, vivid.');
        });

        afterEach(function () {
            el.parentNode.removeChild(el);
        });
    });

    describe('bind helper', function () {
        var el;
        beforeEach(function () {
            el = document.createElement('div');
            document.body.appendChild(el);
        });

        it('binds mustache binding to scope data', function () {
            var tpl = 'Hello, {{name}}.',
                scope = new Scope({
                    name: 'vivid'
                });
            el.appendChild(binding.render(tpl, scope));

            assert.equal(el.innerText, 'Hello, vivid.');
            scope.set('name', 'world');
            assert.equal(el.innerText, 'Hello, world.');

            // unbind
            binding.unbind(el);
            scope.set('name', 'vivid');
            assert.equal(el.innerText, 'Hello, world.');
        });

        afterEach(function () {
            el.parentNode.removeChild(el);
        });
    });

    describe('attr helper', function () {
        var el;
        beforeEach(function () {
            el = document.createElement('div');
            document.body.appendChild(el);
        });

        it('binds attribute value to scope data', function () {
            var tpl = '<a {{attr title=title}}>test link</a>',
                scope = new Scope({
                    title: 'welcome to vivid.'
                }),
                link;
            el.appendChild(binding.render(tpl, scope));
            link = el.firstChild;

            assert.equal(link.getAttribute('title'), 'welcome to vivid.');
            scope.set('title', 'welcome to earth.');
            assert.equal(link.getAttribute('title'), 'welcome to earth.');

            // unbind
            binding.unbind(el);
            scope.set('title', 'welcome to vivid.');
            assert.equal(link.getAttribute('title'), 'welcome to earth.');
        });

        afterEach(function () {
            el.parentNode.removeChild(el);
        });
    });

    describe('action helper', function () {
        var el;
        beforeEach(function () {
            el = document.createElement('div');
            document.body.appendChild(el);
        });

        it('binds event to scope function', function () {
            var tpl = '<a {{attr title=title}}>test link</a>' +
                    '<button {{action click=change}}>try your luck</button>',
                scope = new Scope({
                    title: 'welcome to vivid.',
                    change: function () {
                        this.set('title', 'welcome to earth.');
                    }
                }),
                link;
            el.appendChild(binding.render(tpl, scope));
            link = el.firstChild;

            assert.equal(link.getAttribute('title'), 'welcome to vivid.');
            Simulate.click(el.lastChild);
            assert.equal(link.getAttribute('title'), 'welcome to earth.');

            // change listener
            scope.set('change', function () {
                this.set('title', 'hello, world.');
            });
            Simulate.click(el.lastChild);
            assert.equal(link.getAttribute('title'), 'hello, world.');

            // unbind
            binding.unbind(el);
            scope.set('change', function () {
                this.set('title', 'welcome to earth.');
            });
            Simulate.click(el.lastChild);
            assert.equal(link.getAttribute('title'), 'hello, world.');
        });

        afterEach(function () {
            el.parentNode.removeChild(el);
        });
    });

    describe('if helper', function () {
        var el;
        beforeEach(function () {
            el = document.createElement('div');
            document.body.appendChild(el);
        });

        it('switches branches according to condition', function () {
            var tpl = '{{#if greet}}' +
                    '    <p>You are wellcome, {{name}}!</p>' +
                    '{{else}}' +
                    '    <p>Farewell.</p>' +
                    '{{/if}}',
                scope = new Scope({
                    name: 'vivid',
                    greet: false
                });
            el.appendChild(binding.render(tpl, scope));

            assert.equal(el.querySelector('p').innerHTML, 'Farewell.');
            scope.set('greet', true);
            assert.equal(el.querySelector('p').innerText, 'You are wellcome, vivid!');

            // unbind
            binding.unbind(el);
            scope.set('greet', false);
            assert.equal(el.querySelector('p').innerText, 'You are wellcome, vivid!');
        });

        afterEach(function () {
            el.parentNode.removeChild(el);
        });
    });

    describe('each helper', function () {
        var el;
        beforeEach(function () {
            el = document.createElement('div');
            document.body.appendChild(el);
        });

        it('binds iterator to scope collection data', function () {
            var tpl = '<ul>' +
                    '{{#each collection}}' +
                    '    <li>{{text}}</li>' +
                    '{{/each}}' +
                    '</ul>',
                scope = new Scope({
                    collection: [
                        { text: 'first item.' },
                        { text: 'second item.' },
                        { text: 'third item.' }
                    ]
                }),
                collection = scope.get('collection');
            el.appendChild(binding.render(tpl, scope));

            assert.equal(el.querySelectorAll('li').length, 3);
            assert.equal(el.querySelectorAll('li')[0].innerText, 'first item.');

            collection.pop();
            collection.pop();
            assert.equal(el.querySelectorAll('li').length, 1);
            assert.equal(el.querySelectorAll('li')[0].innerText, 'first item.');

            collection.push({
                text: 'fourth item.'
            });
            assert.equal(el.querySelectorAll('li').length, 2);

            collection.splice(0, 2);
            assert.equal(el.querySelectorAll('li').length, 0);

            // update
            scope.set('collection', [
                { text: 'first person.' },
                { text: 'second person.' }
            ]);
            collection = scope.get('collection');
            assert.equal(el.querySelectorAll('li').length, 2);

            // unbind
            binding.unbind(el);
            collection.push({ text: 'third person.' });
            assert.equal(el.querySelectorAll('li').length, 2);
        });

        it('should support `this` reference', function () {
            var tpl = '<ul>' +
                    '{{#each collection}}' +
                    '    <li>{{this}}</li>' +
                    '{{/each}}' +
                    '</ul>',
                scope = new Scope({
                    collection: [
                        'first item.',
                        'second item.',
                        'third item.'
                    ]
                }),
                collection = scope.get('collection');
            el.appendChild(binding.render(tpl, scope));

            assert.equal(el.querySelectorAll('li').length, 3);
            assert.equal(el.querySelectorAll('li')[0].innerText, 'first item.');
        });


        it('retrieves parent scope through scope property', function () {
            var tpl = '<ul>' +
                    '{{#each collection}}' +
                    '    <li>' +
                    '        {{text}}' +
                    '        <button {{action click=remove}}>delete this item</button>' +
                    '    </li>' +
                    '{{/each}}' +
                    '</ul>',
                cb = function () {
                    // delete this item
                    this.parent.get('collection').remove(this);
                },
                scope = new Scope({
                    collection: [
                        { text: 'first item.', remove: cb },
                        { text: 'second item.', remove: cb },
                        { text: 'third item.', remove: cb }
                    ]
                }),
                collection = scope.get('collection');
            el.appendChild(binding.render(tpl, scope));

            assert.equal(el.querySelectorAll('li').length, 3);
            Simulate.click(el.querySelector('button'));
            assert.equal(el.querySelectorAll('li').length, 2);

            // unbind
            binding.unbind(el);
            Simulate.click(el.querySelector('button'));
            assert.equal(el.querySelectorAll('li').length, 2);
            collection.pop();
            assert.equal(el.querySelectorAll('li').length, 2);
        });

        afterEach(function () {
            el.parentNode.removeChild(el);
        });
    });

    describe('value helper', function () {
        var el;
        beforeEach(function () {
            el = document.createElement('div');
            document.body.appendChild(el);
        });

        it('binds in two direction between scope and dom node', function () {
            var tpl = '<input name="username" {{value name}} />',
                scope = new Scope({
                    name: 'vivid'
                }),
                input;
            el.appendChild(binding.render(tpl, scope));
            input = el.querySelector('input');

            // scope -> dom
            assert.equal(input.value, 'vivid');
            scope.set('name', 'world');
            assert.equal(input.value, 'world');

            // dom -> scope
            input.value = 'vivid';
            Simulate.change(input);
            assert.equal(scope.get('name'), 'vivid');

            // unbind
            binding.unbind(el);
            input.value = 'world';
            Simulate.change(input);
            assert.equal(scope.get('name'), 'vivid');
            scope.set('name', 'meituan');
            assert.equal(input.value, 'world');
        });

        it('should alse work on select tag', function () {
            var tpl = '<select name="province" {{value province}} >' +
                    '    <option value="1">beijing</option>' +
                    '    <option value="2">tianjin</option>' +
                    '    <option value="3">shanghai</option>' +
                    '</select>',
                scope = new Scope({
                    province: '1'
                }),
                select;
            el.appendChild(binding.render(tpl, scope));
            select = el.querySelector('select');

            // scope -> dom
            assert.equal(select.value, '1');
            scope.set('province', '2');
            assert.equal(select.value, '2');
        });

        afterEach(function () {
            el.parentNode.removeChild(el);
        });
    });

    describe('disabled && enabled helper', function () {
        var el;
        beforeEach(function () {
            el = document.createElement('div');
            document.body.appendChild(el);
        });

        it('use outside value to disable els', function () {
            var tpl = '<input class="first" {{disabled inputVal}}/>' +
                        '<input class="second" {{enabled isEnabled}}/> ',
                scope = new Scope({
                    inputVal: false,
                    isEnabled: true
                }),
                input, input2;
            el.appendChild(binding.render(tpl, scope));
            input = el.querySelector('.first');
            input2 = el.querySelector('.second');

            assert.equal(input.disabled, false);
            assert.equal(input2.disabled, false);
            scope.set('inputVal', true);
            assert.equal(input.disabled, true);
            scope.set('isEnabled', false);
            assert.equal(input2.disabled, true);
        });

        afterEach(function () {
            el.parentNode.removeChild(el);
        });
    });

    describe('register & unregister binders', function () {
        var el;
        beforeEach(function () {
            el = document.createElement('div');
            document.body.appendChild(el);
        });

        it('binds in two direction between scope and dom node', function () {
            var tpl = '<input name="username" {{test name}} />',
                scope = new Scope({
                    name: 'vivid'
                }),
                input;

            binder.register('test', {
                update: function (el, value) {
                    el.value = 'test ' + value;
                }
            });

            el.appendChild(binding.render(tpl, scope));
            input = el.querySelector('input');

            assert.equal(input.value, 'test vivid');
            scope.set('name', 'world');
            assert.equal(input.value, 'test world');

            // unregister
            binder.unregister('test');
            el.innerHTML = '';
            assert.throws(function () {
                el.appendChild(binding.render(tpl, scope));
            });
        });

        afterEach(function () {
            el.parentNode.removeChild(el);
        });
    });

    describe('test show && hide helper', function () {
        var el;
        beforeEach(function() {
            el = document.createElement('div');
            document.body.appendChild(el);
        });

        it('show && hide helper tests', function () {
            var tpl = '<div {{show isShow}}> Hello World </div><p {{hide isHidden}}>Hello Vivid</p>',
                scope = new Scope({
                    isShow: false,
                    isHidden: true
                }),
                div,
                p;

            el.appendChild(binding.render(tpl, scope));
            div = el.querySelector('div');
            p = el.querySelector('p');

            assert.equal(div.style.display, 'none');
            assert.equal(p.style.display, 'none');

            scope.set('isShow', true);
            scope.set('isHidden', false);

            assert.notEqual(div.style.display, 'none', 'show helper error');
            assert.notEqual(p.style.display, 'none', 'hide helper error');
        });

        afterEach(function () {
            el.parentNode.removeChild(el);
        });
    });

    describe('test checked helper', function () {
        var el;
        beforeEach(function() {
            el = document.createElement('div');
            document.body.appendChild(el);
        });
        it('checked helper tests', function () {
            var tpl = '<input type="checkbox" {{checked isChecked}}/>',
                scope = new Scope({
                    isChecked: true
                }),
                input;

            el.appendChild(binding.render(tpl, scope));
            input = el.querySelector('input');

            assert.equal(input.checked, true);

            scope.set('isChecked', false);
            assert.equal(input.checked, false);

            input.checked = true;
            Simulate.change(input);
            assert.equal(scope.get('isChecked'), true, 'checked bind fails');

            binding.unbind(el);
            input.checked = false;
            Simulate.change(input);
            assert.equal(scope.get('isChecked'), true, 'checked unbind fails');

        });
        afterEach(function() {
            el.parentNode.removeChild(el);
        });
    });

    describe('test unchecked helper', function () {
        var el;
        beforeEach(function() {
            el = document.createElement('div');
            document.body.appendChild(el);
        });
        it('unchecked helper tests', function () {
            var tpl = '<input type="checkbox" {{unchecked isUnChecked}}/>',
                scope = new Scope({
                    isUnChecked: true
                }),
                input;

            el.appendChild(binding.render(tpl, scope));
            input = el.querySelector('input');

            assert.equal(input.checked, false);

            scope.set('isUnChecked', false);
            assert.equal(input.checked, true);

            input.checked = false;
            Simulate.change(input);
            assert.equal(scope.get('isUnChecked'), true, 'unchecked bind fails');

            binding.unbind(el);
            input.checked = true;
            Simulate.change(input);
            assert.equal(scope.get('isUnChecked'), true, 'unchecked unbind fails');

        });
        afterEach(function() {
            el.parentNode.removeChild(el);
        });
    });

    describe('test valuechange helper', function () {
        var el;
        beforeEach(function() {
            el = document.createElement('div');
            document.body.appendChild(el);
        });
        it('valuechange helper', function () {
            var tpl = '<input type="text" {{valuechange username}}/>',
                scope = new Scope({
                    username: 'vivid'
                }),
                input;

            el.appendChild(binding.render(tpl, scope));
            input = el.querySelector('input');

            assert.equal('vivid', input.value);
            //模拟在input的值为vivid的时候输入'a', 故手动设置input.value
            //原因Simulate在模拟keyboard event不能更新value
            input.value="vivida";
            Simulate.keydown(input, 'a');
            assert.equal('vivida', scope.get('username'));

            binding.unbind(el);
            input.value="vivid";
            Simulate.keydown(input, 'a');
            assert.equal('vivida', scope.get('username'));
        });
        afterEach(function() {
            el.parentNode.removeChild(el);
        });
    });

    describe('test class helper', function () {
        var el;
        beforeEach(function() {
            el = document.createElement('div');
            document.body.appendChild(el);
        });
        it('class helper', function () {
            var tpl = '<div class="form-field" {{class form-field--ok=sendOk form-field--large=isLarge}}></div>',
                scope = new Scope({
                    sendOk: false,
                    isLarge: true
                }),
                div;
            el.appendChild(binding.render(tpl, scope));
            div = el.querySelector('.form-field');
            assert.equal(dom.hasClass(div, 'form-field--ok'), false, 'ok fails');
            assert.equal(dom.hasClass(div, 'form-field--large'), true, 'large fails');

            scope.set('sendOk', true);
            scope.set('isLarge', false);
            assert.equal(dom.hasClass(div, 'form-field--ok'), true);
            assert.equal(dom.hasClass(div, 'form-field--large'), false);
        });
        afterEach(function() {
            el.parentNode.removeChild(el);
        });
    });
});
