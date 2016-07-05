var gulp = require('gulp'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    glob = require('glob'),
    watch = require('gulp-watch'),
    spawn = require('child_process').spawn,
    uglify = require('uglify-js'),
    argv = require('yargs').argv,
    fs = require('fs');

gulp.task('default', function () {
    browserify({
            entries:'./src/vivid.js',
            standalone: 'vivid'
        })
        .bundle()
        .pipe(source('vivid.js'))
        .pipe(gulp.dest('./build/'));
});

gulp.task('test', function () {
    browserify({
            entries: glob.sync('./test/*.js'),
            debug: true
        })
        .bundle()
        .pipe(source('test.js'))
        .pipe(gulp.dest('./build/'));
});

gulp.task('release', function () {
    var result = uglify.minify('build/vivid.js', {
        mangle: true,
        compress: {
            sequences: true,
            dead_code: true,
            conditionals: true,
            booleans: true,
            unused: true,
            if_return: true,
            join_vars: true,
            drop_console: true
        }
    });

    fs.writeFileSync('build/vivid-v' + argv.v + '.js', result.code);
});

gulp.task('watch', function () {
    watch('src/*.js', function (files, cb) {
        gulp.start('default', cb);
    });
    watch(['src/*.js', 'test/*.js'], function (files, cb) {
        gulp.start('test', cb);
    });
});

gulp.task('compress', function () {
    var result = uglify.minify('lib/handlebars-v2.0.0.js', {
        mangle: true,
        compress: {
            sequences: true,
            dead_code: true,
            conditionals: true,
            booleans: true,
            unused: true,
            if_return: true,
            join_vars: true,
            drop_console: true
        }
    });

    fs.writeFileSync('build/handlebars-v2.0.0.js', result.code);
});

gulp.task('runtest', ['default', 'test'], function () {
    return spawn('node_modules/karma/bin/karma', ['start', 'karma.conf.js'], {stdio:'inherit'});
});

