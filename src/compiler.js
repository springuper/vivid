'use strict';

var util = require('./util'),
    originMustache = Handlebars.Compiler.prototype.mustache,
    VHandlebars = Handlebars.create();

if (Handlebars.VERSION < '2.0.0') {
    throw new Error('Vivid requires Handlebars version 2.0.0 or higher.');
}

VHandlebars.Compiler = function () {};
if (Handlebars.Compiler) {
    VHandlebars.Compiler.prototype = util.create(Handlebars.Compiler.prototype);
}
VHandlebars.Compiler.prototype.compiler = VHandlebars.Compiler;
/**
 * Rewrite simple mustaches from `{{foo}}` to `{{bind "foo"}}`
 */
VHandlebars.Compiler.prototype.mustache = function (mustache) {
    if (!(mustache.params.length || mustache.hash)) {
        var id = new Handlebars.AST.IdNode([{ part: 'bind' }]);
        if (!mustache.escaped) {
            mustache.hash = mustache.hash || new Handlebars.AST.HashNode([]);
            mustache.hash.pairs.push(["unescaped", new Handlebars.AST.StringNode("true")]);
        }
        mustache = new Handlebars.AST.MustacheNode([id, mustache.id], mustache.hash, !mustache.escaped);
    }
    return originMustache.call(this, mustache);
};

VHandlebars.JavaScriptCompiler = function () {};
if (Handlebars.JavaScriptCompiler) {
    VHandlebars.JavaScriptCompiler.prototype = util.create(Handlebars.JavaScriptCompiler.prototype);
    VHandlebars.JavaScriptCompiler.prototype.compiler = VHandlebars.JavaScriptCompiler;
}
VHandlebars.JavaScriptCompiler.prototype.namespace = 'Vivid.Handlebars';

VHandlebars.precompile = function (value) {
    var ast = Handlebars.parse(value),
        options = {
            knownHelpers: {
                // NOTE should sync which binders
                action: true,
                attr: true,
                bind: true,
                checked: true,
                'class': true,
                disabled: true,
                enabled: true,
                hide: true,
                show: true,
                unchecked: true,
                value: true,
                valuechange: true
            },
            data: true,
            stringParams: true
        },
        environment;
    environment = new VHandlebars.Compiler().compile(ast, options);
    return new VHandlebars.JavaScriptCompiler().
            compile(environment, options, undefined, true);
};
if (Handlebars.compile) {
    VHandlebars.compile = function (string) {
        return VHandlebars.template(VHandlebars.precompile(string));
    };
}

module.exports = VHandlebars;
