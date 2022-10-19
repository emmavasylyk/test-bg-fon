const gulp = require('gulp');
const paths = require('../paths');

const video = () => {
  return gulp.src(paths.src.video).pipe(gulp.dest(paths.build.video));
};

module.exports = video;
