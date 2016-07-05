# Vivid

A simple, lightweight **Data Binding Layer** based on string-based template engines.

## Why choose Vivid

- simple, especially on internal implemention
- good compatibility, IE6~8 are also supported
- focus, only invest deep in two-way data binding, you are free to choose any string-based template engines (currently only Handlebars) and any model/router implementions

## API

### Scope

`Scope` is a constructor for all your data or actions. You can use `set` and `get` methods to access any property, or `sub` method to listen for property changes.

```javascript
var scope = new vivid.Scope({
    name: 'spring',
    change: function () {
        this.set('name', 'any value you want');
    }
});

// listen for property changes
scope.sub('name', function (newVal, val) {
    console.log('now the value is ', newVal);
});
```

### render

`render` is a method to combine template source and scope and return a document fragment that contains all rendered DOM nodes.

```javascript
var frag = vivid.render(templateSource, scope);
document.querySelector('selector').appendChild(frag);
```

### ObservableArray

`ObservableArray` is still in progress, and many features are not implemented.

## Example

### Two-way Data Binding
```html
<script type="text/x-handlebars" data-template-name="input">
    <input name="username" {{value username}} />
    <p>Hi, {{username}}</p>
</script>
<script>
var scope = new vivid.Scope({
        username: 'spring'
    }),
    source = document.querySelector('[data-template-name="input"]').innerHTML;
document.body.appendChild(vivid.render(source, scope));
</script>
```

### `if-else` block helper
```html
<script type="text/x-handlebars" data-template-name="greet">
    {{#if greet}}
        <p>you are wellcome!</p>
    {{else}}
        <p>farewell</p>
    {{/if}}
</script>
<script>
var scope = new vivid.Scope({
        greet: true
    }),
    source = document.querySelector('[data-template-name="greet"]').innerHTML;
document.body.appendChild(vivid.render(source, scope));

// when need to toggle greet
scope.set('greet', !scope.get('greet'));
</script>
```

### `each` block helper
```html
<script type="text/x-handlebars" data-template-name="comment">
    <ul>
    {{#each comments}}
        <li>
            <h2>{{subject}}</h2>
            {{{body}}}
            <button {{action click=change}}>try your luck</button>
        </li>
    {{/each}}
    </ul>
</script>
<script>
var scope = new vivid.Scope({
        comments: [
            {   
                subject: 'good job!',
                body: '<strong>Awesome!</strong>',
                change: function () {
                    this.set('subject', ['spring', 'summer', 'autumn', 'winter'][Date.now() % 4]);
                }
            },
            {
                subject: 'nice',
                body: 'this is a nice day',
                change: function () {
                    this.set('subject', ['spring', 'summer', 'autumn', 'winter'][Date.now() % 4]);
                }
            }
        ]
    }),
    source = document.querySelector('[data-template-name="comment"]').innerHTML;
document.body.appendChild(vivid.render(source, scope));
</script>
```

## How to contribute

It's pretty easy to develop Vivid because it uses gulp, karma and browserify.

```bash
# ensure you have installed gulp and karma
# npm install -g gulp
# npm install -g karma
# npm install -g karma-cli

# clone Vivid repo
git clone git@github.com:springuper/vivid.git

# install npm packages
cd fe.vivid
npm install

# open a tab to run gulp watch
gulp watch

# open another tab to run karma
karma start
```

After the above actions, you can write code under the src and test folders, test results will instantly show on karma tab. Remember every behaviour should be fully tested.

Welcome join us to make Vivid better!

## What's next

[RoadMap](https://github.com/springuper/vivid/blob/master/doc/roadmap.md).
