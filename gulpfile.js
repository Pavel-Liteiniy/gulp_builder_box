const { src, dest, parallel, series, watch } = require('gulp');
const browserSync = require('browser-sync').create();
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const csso = require('gulp-csso');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const svgstore = require('gulp-svgstore');
const posthtml = require('gulp-posthtml');
const include = require('posthtml-include');
const del = require('del');

function sync() {
  browserSync.init({
    server: {
      baseDir: './build/',
    },
    notify: false,
    online: true,
    open: true,
    cors: true,
    ui: false,
  });

  watch('./src/*.html', series(html)).on('change', browserSync.reload);
  watch('./src/scss/**/*.scss', series(scss));
  watch('./src/css/**/*.css', series(css));
  watch('./src/js/**/*.js', series(js)).on('change', browserSync.reload);
}

function js() {
  return src('./src/js/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: ['@babel/env'],
      })
    )
    .pipe(uglify())
    .pipe(
      rename({
        suffix: '.min',
      })
    )
    .pipe(dest('./build/js/'));
}

function scss() {
  return src('./src/scss/style.scss')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(postcss([autoprefixer()]))
    .pipe(csso())
    .pipe(rename('style.min.css'))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('./build/css'))
    .pipe(browserSync.stream());
}

function css() {
  return src('./src/css/**/*.css')
    .pipe(postcss([autoprefixer()]))
    .pipe(csso())
    .pipe(
      rename({
        suffix: '.min',
      })
    )
    .pipe(dest('./build/css'))
    .pipe(browserSync.stream());
}

function convertWebp() {
  return src('./src/img/**/*.{png,jpg}')
    .pipe(webp({ quality: 90 }))
    .pipe(dest('./src/img'));
}

function sprite() {
  return src('./src/img/**/icon-*.svg')
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename('sprite.svg'))
    .pipe(dest('./build/img'));
}

function html() {
  return src('./src/*.html')
    .pipe(posthtml([include()]))
    .pipe(dest('./build/'));
}

function img() {
  return src('./src/img/**/*.{png,jpg,svg}')
    .pipe(
      imagemin([
        imagemin.optipng({ optimizationLevel: 3 }),
        imagemin.mozjpeg({ quality: 80, progressive: true }),
        imagemin.svgo(),
      ])
    )
    .pipe(dest('./src/img'));
}

function copy() {
  return src(
    [
      './src/css/**/*.{woff,woff2}',
      './src/fonts/**/*.{woff,woff2}',
      './src/img/**',
      '!./src/img/**/icon-*.svg',
    ],
    {
      base: './src/',
    }
  ).pipe(dest('./build/'));
}

function clear() {
  return del('./build');
}

exports.build = series(
  parallel(clear, convertWebp, series(img, sprite, html)),
  copy,
  scss,
  js
);
exports.start = series(exports.build, sync);
