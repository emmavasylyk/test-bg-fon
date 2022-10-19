'use strict';

const { series, parallel, watch } = require('gulp');
const requireDir = require('require-dir');
const browserSync = require('browser-sync').create();
const tasks = requireDir('./gulp/tasks', { recurse: true });
const paths = require('./gulp/paths');

const serve = () => {
  return browserSync.init({
    server: 'build/',
    startPath: '/index.html',
    notify: false,
    open: true,
    cors: true,
    ui: false,
    logPrefix: 'DevServer',
    host: 'localhost',
    port: process.env.PORT || 1234,
  });
};

const watcher = done => {
  watch(paths.watch.data).on(
    'change',
    series(tasks.db, tasks.html.html, tasks.css, browserSync.reload)
  );
  watch(paths.watch.html).on('change', series(tasks.html.html, tasks.css, browserSync.reload));
  watch([paths.watch.tailwindcss, paths.watch.css]).on(
    'change',
    series(tasks.css, browserSync.reload)
  );
  watch(paths.watch.js).on('change', series(tasks.scripts, browserSync.reload));
  watch(paths.watch.images, tasks.images);
  watch(paths.watch.sprite, tasks.sprite);
  watch(paths.watch.fonts, tasks.fonts);
  watch(paths.watch.crm, tasks.crm);
  watch(paths.watch.app, tasks.app);
  watch(paths.watch.phpmailer, tasks.phpmailer);

  done();
};

exports.start = series(
  tasks.clean,
  parallel(
    tasks.php,
    tasks.db,
    tasks.images,
    tasks.sprite,
    tasks.css,
    tasks.fonts,
    tasks.scripts,
    tasks.html.html,
    tasks.crm,
    tasks.app,
    tasks.phpmailer
  ),
  watcher,
  serve
);

exports.build = series(
  tasks.clean,
  parallel(
    tasks.db,
    tasks.php,
    tasks.images,
    tasks.imagesWebp,
    tasks.sprite,
    tasks.css,
    tasks.fonts,
    tasks.scripts,
    tasks.html.html,
    tasks.crm,
    tasks.app,
    tasks.phpmailer
  )
);
