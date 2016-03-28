var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var rollup = require('gulp-rollup');
var typescript = require('rollup-plugin-typescript');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');


gulp.task('client', function() {
    return gulp.src('rippyshreddy.ts')
        .pipe(sourcemaps.init())
        .pipe(rollup({
            format: 'iife',
            moduleName: 'RippyShreddy',
            plugins: [
                typescript()
            ]
        }))
        .pipe((rename('rippyshreddy.js')))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
});

gulp.task('server', function() {
    return gulp.src('server.ts')
        .pipe(sourcemaps.init())
        .pipe(rollup({
            format: 'cjs',
            plugins: [
                typescript()
            ]
        }))
        .pipe((rename('rippyshreddy-server.js')))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['client', 'server']);


gulp.task('client-dist', ['client'], function() {
    return gulp.src('dist/rippyshreddy.js')
        .pipe(uglify())
        .pipe((rename('rippyshreddy.min.js')))
        .pipe(gulp.dest('dist'));
});

gulp.task('server-dist', ['server'], function() {
});

gulp.task('dist', ['client-dist', 'server-dist']);
