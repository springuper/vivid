# RoadMap

## 0.1.0 [done]

Vivid borns.

## 0.2.0 [done]

- improve `ObservableArray` to a stable and complete state. [done]
- establish test mechanism. [done]

## 0.3.0 [done]

This version focuses mainly on binder mechanism and computed property.

- normalize binder mechanism to give a standard way to add new binders. [done]
- add more binders, such as select, textarea, etc. [done]
- support computed property. [done]

## 0.4.0

This version focuses mainly on docs, demos and quality.

- write user guide docs to introduce how to use and what's under the hood.
- add demos to show the real effect.
- make it more easily for other developers to contribute.
- add tests for util, dom.
- jshint.
- ci.

## 0.5.0

This version focuses mainly on template engine and bindings.

- create Handlebars extension to avoid collapse with normal render.
- support filters, and Mustache bindings.

## TODO

- support valuechange binder to update more instantly than value binder.
- try RequireJS to manage code base, maybe it's a better choice than Browserify.
- unify terms such as propery/attribute, binding/binder.
