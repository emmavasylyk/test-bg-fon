const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');
const size = require('gulp-size');
const paths = require('../paths');
const webp = require('imagemin-webp');
const rename = require('gulp-rename');

const imagesWebp = done => {
  return gulp
    .src(paths.src.images + '/*.{jpg,png}')
    .pipe(newer(paths.build.images))
    .pipe(
      imagemin([
        webp({
          // lossless: true, if pngs turn out sucky uncomment this and redo just pngs
          quality: 80,
        }),
      ])
    )
    .pipe(rename({ extname: '.webp' }))
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest(paths.build.images));

  done();
};

module.exports = imagesWebp;
