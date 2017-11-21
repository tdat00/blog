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
    var rgxMatchFilename = /\d{4}-\d{2}-\d{2}-.+\.md$/ig;
    var rgxMatchTags = /---[^]*tags:\s*\[?(.*?)\]?\s*\r?\n[^]*---/igm;

    if (!file.match(rgxMatchFilename)) {
      return;
    }

    var match = rgxMatchTags.exec(fs.readFileSync(path.join('./_posts', file), 'utf8'));
    if (match && match[1]) {
      match[1].split(/[,\s]+/ig).forEach(tag => {
        if (tag.trim()) {
          tags[friendlyUrl(tag.trim())] = tag.trim();
        }
      });
    }
  });
  return tags;
};

var rebuildCategories = function () {
  var categories = {};

  fs.readdirSync('./_posts').forEach(file => {
    var rgxMatchFilename = /\d{4}-\d{2}-\d{2}-.+\.md$/ig;
    var rgxMatchCategories = /---[^]*categories:\s*\[?(.*?)\]?\s*\r?\n[^]*---/igm;

    if (!file.match(rgxMatchFilename)) {
      return;
    }

    var match = rgxMatchCategories.exec(fs.readFileSync(path.join('./_posts', file), 'utf8'));
    if (match && match[1]) {
      var cats = match[1].split(/[,\s]+/ig);
      for (var i = 1; i <= cats.length; i++) {
        categories[cats.slice(0, i).join('/')] = cats.slice(0, i).join(' ');
      }
    }
  });
  return categories;
};

var friendlyUrl = function (url) {
  return url.replace(/#/ig, 'sharp')
    .replace(/\./ig, 'dot');
};

var writeFile = function (filename, content) {
  var folder = path.dirname(filename);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
  fs.writeFileSync(filename, content);
};

gulp.task('server', ['serve']);
gulp.task('serve', function (cb) {
  run('bundle exec jekyll serve --watch');
});

gulp.task('build-tags', function (cb) {
  var content = '',
    tags = rebuildTags();
  for (var tagUrl in tags) {
    content += tagUrl + ': ' + tags[tagUrl] + '\n';
    writeFile('./tag/' + tagUrl + '.md',
      `---
layout: tag
title: Posts with tag '{tag}'
tag: {tag}
permalink: /tag/{tag-url}/
---`.replace(/\{tag\}/ig, tags[tagUrl]).replace(/\{tag-url\}/ig, tagUrl)
    );
  }
  writeFile('./_data/tags.yml', content);
  cb && cb();
});

gulp.task('build-categories', function (cb) {
  var categories = rebuildCategories();
  for (var categoryUrl in categories) {
    writeFile('./category/' + categoryUrl + '.md',
      `---
layout: category
title: Posts in category '{category-url}'
category: {category}
permalink: /{category-url}/
---`.replace(/\{category\}/ig, categories[categoryUrl]).replace(/\{category-url\}/ig, categoryUrl)
    );
  }
  cb && cb();
});

gulp.task('clean-tags', function (cb) {
  gulp.src('./tag/**/*.md', {
      read: false
    })
    .pipe(clean());
    cb && cb()
});

gulp.task('clean-categories', function (cb) {
  gulp.src('./category', {
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

gulp.task('clean', ['clean-sites', 'clean-tags', 'clean-categories'], function (cb) {
  cb && cb();
});

gulp.task('build', ['build-tags', 'build-categories'], function (cb) {
  run('bundle exec jekyll build', cb);
});

gulp.task('install-bundler', function (cb) {
  run('gem install bundler', cb)
});

gulp.task('install', ['install-bundler'], function (cb) {
  run('bundle install', cb);
});
