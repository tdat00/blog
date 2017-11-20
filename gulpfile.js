var gulp = require('gulp');
var clean = require('gulp-clean');
var gutil = require('gulp-util');
var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');

var run = function (command, cb) {
  var child = spawn('cmd', ['/c', command]);
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', function (data) {
    gutil.log(data.trim());
  });

  child.stderr.setEncoding('utf8');
  child.stderr.on('data', function (data) {
    gutil.log(gutil.colors.red(data));
  });

  child.on('close', function (code) {
    cb && cb(code);
  });
};

var rebuildTags = function () {
  var tags = {};

  fs.readdirSync('./_posts').forEach(file => {
    var rgxMatchFilename = /\d{4}-\d{2}-\d{2}-.+\..+/ig;
    var rgxMatchTags = /---[^]*tags:(.*?)\r?\n[^]*---/igm;

    if (!file.match(rgxMatchFilename)) {
      return;
    }

    var match = rgxMatchTags.exec(fs.readFileSync(path.join('./_posts', file), 'utf8'));
    if (match && match[1]) {
      match[1].split(/[,\s]/ig).forEach(tag => {
        if (tag.trim()) {
          tags[friendlyUrl(tag.trim())] = tag.trim();
        }
      });
    }
  });
  return tags;
};

var friendlyUrl = function (url) {
  return url.replace(/#/ig, 'sharp')
    .replace(/\./ig, 'dot');
};


gulp.task('server', ['serve']);
gulp.task('serve', function (cb) {
  run('bundle exec jekyll serve --watch');
});

gulp.task('rebuild-tags', function (cb) {
  var content = '',
    tags = rebuildTags();
  for (var tag in tags) {
    content += tag + ': ' + tags[tag] + '\n';
    fs.writeFileSync('./tag/' + tag + '.md',
      `---
layout: tag
title: Posts with tag "{tag}"
sub-header: Posts with tag "{tag}"
tag: {tag}
permalink: /tag/{tag-url}/
---`.replace(/\{tag\}/ig, tags[tag]).replace('{tag-url}', tag)
    );
  }
  fs.writeFileSync('./_data/tags.yml', content);
  cb && cb();
});

gulp.task('clean-tags', function (cb) {
  gulp.src('./tag/**/*.md', {
      read: false
    })
    .pipe(clean());
    cb && cb()
});

gulp.task('clean-sites', function (cb) {
  gulp.src('./_site', {
      read: false
    })
    .pipe(clean());
  cb && cb()
});

gulp.task('clean', ['clean-sites', 'clean-tags'], function (cb) {
  cb && cb();
});

gulp.task('build', ['clean', 'rebuild-tags'], function (cb) {
  run('bundle exec jekyll build', cb);
});

gulp.task('install-bundler', function (cb) {
  run('gem install bundler', cb)
});

gulp.task('install', ['install-bundler'], function (cb) {
  run('bundle install', cb);
});
