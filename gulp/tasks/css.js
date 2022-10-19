const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const plumber = require('gulp-plumber');
const sass = require('gulp-sass')(require('sass'));
const gcmq = require('gulp-group-css-media-queries');
const postcss = require('gulp-postcss');
const size = require('gulp-size');
const mode = require('gulp-mode')();
const paths = require('../paths');
const fs = require('fs');
const tailwindcss = require('tailwindcss');
const concat = require('gulp-concat');
const cleanCSS = require('gulp-clean-css');
const purgecss = require('gulp-purgecss');

const css = done => {
  return gulp
    .src(paths.src.css)
    .pipe(plumber())
    .pipe(mode.development(sourcemaps.init()))
    .pipe(
      sass({
        sourceMap: true,
        precision: 3,
        errLogToConsole: true,
      }).on('error', sass.logError)
    )
    .pipe(mode.production(gcmq()))
    .pipe(
      postcss(
        [
          require('postcss-import')(),
          tailwindcss('./tailwind.config.js'),
          require('tailwindcss/nesting'),
          require('autoprefixer'),
        ],
        {
          parser: require('postcss-scss'),
        }
      )
    )
    .pipe(
      mode.production(
        purgecss({
          content: ['src/**/*.{html,js,njk,json}'],
          skippedContentGlobs: ['node_modules/**'],
          defaultExtractor: content => {
            const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
            const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || [];
            return broadMatches.concat(innerMatches);
          },
        })
      )
    )
    .pipe(mode.production(cleanCSS({ compatibility: 'ie8' })))
    .pipe(concat({ path: 'style.css' }))
    .pipe(size({ showFiles: true }))
    .pipe(mode.development(sourcemaps.write('./')))
    .pipe(gulp.dest(paths.build.css));

  done();
};

module.exports = css;
