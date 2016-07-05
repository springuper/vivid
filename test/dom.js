'use strict';

var assert = require('assert'),
    dom = require('../src/dom');

describe('dom', function () {
    describe('#toDOM', function () {
        it('convert plain text to TextNode', function () {
            var html = 'plain text',
                frag = dom.toDOM(html);
            assert(frag instanceof window.DocumentFragment);
            assert.equal(frag.childNodes.length, 1);
            assert.equal(frag.childNodes[0].nodeType, 3);
            assert.equal(frag.childNodes[0].nodeValue, 'plain text');
        });
        it('convert normal tag to DOM', function () {
            var html = '<p>normal content</p><p>second paragraph</p>',
                frag = dom.toDOM(html);
            assert.equal(frag.childNodes.length, 2);
            assert.equal(frag.childNodes[0].nodeType, 1);
            assert.equal(frag.childNodes[1].innerHTML, 'second paragraph');
        });
        it('convert special tag to DOM', function () {
            var html,
                frag;

            // td/th
            html = '<td>123</td>';
            frag = dom.toDOM(html);
            assert.equal(frag.childNodes.length, 1);
            assert.equal(frag.childNodes[0].tagName.toLowerCase(), 'td');

            // tr
            html = '<tr><td>123</td></tr>';
            frag = dom.toDOM(html);
            assert.equal(frag.childNodes.length, 1);
            assert.equal(frag.childNodes[0].tagName.toLowerCase(), 'tr');

            // tbody/tfoot/colgroup/caption/thead
            html = '<tbody><tr><td>123</td></tr></tbody>';
            frag = dom.toDOM(html);
            assert.equal(frag.childNodes.length, 1);
            assert.equal(frag.childNodes[0].tagName.toLowerCase(), 'tbody');

            // option
            html = '<option value="1">text</option>';
            frag = dom.toDOM(html);
            assert.equal(frag.childNodes.length, 1);
            assert.equal(frag.childNodes[0].tagName.toLowerCase(), 'option');
            assert.equal(frag.childNodes[0].value, '1');
        });
    });
});
