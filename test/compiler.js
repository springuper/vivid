var assert = require('assert'),
    VHandlebars = require('../src/compiler');

describe('VHandlebars', function () {
    it('should not conflict with global Handlebars', function () {
        var source = 'Hello, {{xxx name}}.',
            scope = {
                name: 'Vivid'
            },
            templateHandlebars,
            templateVHandlebars;
        
        Handlebars.registerHelper('xxx', function (context) {
            return this[context];
        });
        VHandlebars.registerHelper('xxx', function (context) {
            return this[context].split('').reverse().join('');
        });

        templateHandlebars = Handlebars.compile(source, {
            data: true,
            stringParams: true
        })(scope);
        templateVHandlebars = VHandlebars.compile(source)(scope);

        assert.equal(templateHandlebars, 'Hello, Vivid.');
        assert.equal(templateVHandlebars, 'Hello, diviV.');
    });

    it('should rewrite normal mustaches', function () {
        var source = 'Hello, {{name}}.',
            scope = {
                name: 'Vivid'
            },
            templateVHandlebars,
            originHelper;

        // reserve origin helper
        originHelper = VHandlebars.helpers['bind'];
        VHandlebars.unregisterHelper('bind');

        VHandlebars.registerHelper('bind', function (context) {
            return this[context].split('').reverse().join('');
        });
        templateVHandlebars = VHandlebars.compile(source)(scope);
        assert.equal(templateVHandlebars, 'Hello, diviV.');

        // restore
        VHandlebars.registerHelper('bind', originHelper);
    });
});
