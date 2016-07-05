'use strict';

var util = require('./util'),
    add = document.addEventListener ? function (el, type, fn) {
            el.addEventListener(type, fn);
        } : function (el, type, fn) {
            el.attachEvent('on' + type, fn);
        },
    remove = document.removeEventListener ? function (el, type, fn) {
            el.removeEventListener(type, fn);
        } : function (el, type, fn) {
            el.detachEvent('on' + type, fn);
        },
    regTag = /^\s*<(\w+)/,
	// close these tags to support XHTML (#13200)
	wrapMap = {
		option: [1, '<select multiple="multiple">', '</select>'],

		thead: [1, '<table>', '</table>'],
		col: [2, '<table><colgroup>', '</colgroup></table>'],
		tr: [2, '<table><tbody>', '</tbody></table>'],
		td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],

		_default: [0, '', '']
	};
wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

module.exports = {
    insertAfter: function (nodes, el) {
        var elParent = el.parentNode,
            elFirst = nodes[0];
        util.each(nodes, function (node) {
            elParent.insertBefore(node, el);
        });
        elParent.insertBefore(el, elFirst);
    },
    remove: function(nodes) {
        util.each(nodes, function (node) {
            node.parentNode.removeChild(node);
        });
    },
    /**
     * replace nodes after specific element
     * @param {HTMLElement} el
     * @param {[HTMLElement]|String} nodes
     * @param {[HTMLElement]} nodes
     * @return {[HTMLElement]}
     */
    replace: function (el, nodes, oldNodes) {
        var elContainer;
        if (typeof nodes === 'string') {
            elContainer = document.createElement('div');
            elContainer.innerHTML = nodes;
            nodes = util.makeArray(elContainer.childNodes);
        }
        if (nodes.length) {
            this.insertAfter(nodes, el);
        }
        if (oldNodes && oldNodes.length) {
            this.remove(oldNodes);
        }
        return nodes;
    },
    on: function (el, types, fn) {
        if (!util.isArray(types)) types = [types];
        util.each(util.makeArray(types), function (type) {
            add(el, type, fn);
        });
    },
    off: function (el, types, fn) {
        if (!util.isArray(types)) types = [types];
        util.each(util.makeArray(types), function (type) {
            remove(el, type, fn);
        });
    },
    hasClass: function (el, classname) {
        if (!el.className || !classname) return false;
        return (' ' + el.className + ' ').indexOf(' ' + classname + ' ') !== -1;
    },
    addClass: function (el, classname) {
        if (this.hasClass(el, classname)) return;
        var ret = el.className.split(/\s+/);
        ret.push(classname);
        el.className = ret.join(' ');
    },
    removeClass: function (el, classname) {
        if (!this.hasClass(el, classname)) return;
        var classList = el.className.split(/\s+/);
        var ret = [];
        for(var i = 0, len = classList.length; i < len; i++) {
            if (classList[i] !== classname) {
                ret.push(classList[i]);
            }
        }
        el.className = ret.join(' ');
    },
    toDOM: function (content) {
        var frag = document.createDocumentFragment(),
            container = document.createElement('div'),
            tag,
            wrap,
            i;

        tag = (regTag.exec(content) || ['', ''])[1].toLowerCase();
        wrap = wrapMap[tag] || wrapMap._default;
        // NOTE workaround for IE: http://allofetechnical.wordpress.com/2010/05/21/ies-innerhtml-method-with-script-and-style-tags/
        container.innerHTML = '<span>-</span>' + wrap[1] + content + wrap[2];
        container.removeChild(container.firstChild);
        i = wrap[0];
        while (i--) {
            container = container.lastChild;
        }
        while (container.firstChild) {
            frag.appendChild(container.firstChild);
        }

        return frag;
    }
};
