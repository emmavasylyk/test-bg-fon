const gulp = require('gulp');
const svgSprite = require('gulp-svg-sprite');
const newer = require('gulp-newer');
const size = require('gulp-size');
const paths = require('../paths');

const sprite = done => {
  return gulp
    .src(paths.src.sprite)
    .pipe(newer(paths.build.sprite))
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: '../sprite.svg',
          },
        },
      })
    )
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest(paths.build.sprite));
  done();
};

module.exports = sprite;
