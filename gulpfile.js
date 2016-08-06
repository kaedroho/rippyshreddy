var gulp = require('gulp');
var rollup = require('rollup-stream');
var typescript = require('rollup-plugin-typescript');
var uglify = require('gulp-uglify');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify')


gulp.task('client', function() {
    return rollup({
            entry: 'src/rippyshreddy.ts',
            format: 'iife',
            moduleName: 'RippyShreddy',
            plugins: [
                typescript({
                    typescript: require('typescript')
                }),
            ]
        })
        .pipe(source('rippyshreddy.js'))
        .pipe(gulp.dest('dist'));
});

gulp.task('server', function() {
    return rollup({
            entry: 'src/server.ts',
            format: 'cjs',
            plugins: [
                typescript({
                    typescript: require('typescript')
                }),
            ]
        })
        .pipe(source('rippyshreddy-server.js'))
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['client', 'server']);


gulp.task('client-dist', ['client'], function() {
    return gulp.src('dist/rippyshreddy.js')
        .pipe(uglify())
        .pipe(rename('rippyshreddy.min.js'))
        .pipe(gulp.dest('dist'));
});

gulp.task('server-dist', ['server'], function() {
});

gulp.task('dist', ['client-dist', 'server-dist']);
