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

var getAllDates = function () {
  var dates = {};

  fs.readdirSync('./_posts').forEach(file => {
    var rgxMatchFilename = /\d{4}-\d{2}-\d{2}-.+\.md$/ig;
    var rgxMatchDates = /---[^]*date:\s*\[?\s*(\d{4}\-\d{2}\-\d{2}).*\]?\s*\r?\n[^]*---/igm;

    if (!file.match(rgxMatchFilename)) {
      return;
    }

    var match = rgxMatchDates.exec(readFile('./_posts/' + file));
    if (match && match[1]) {
      var arr = match[1].split('-');
      dates[arr.slice(0,1).join('/')] = true;
      dates[arr.slice(0,2).join('/')] = true;
      dates[arr.slice(0,3).join('/')] = true;
    }
  });
  return dates;
};

var getAllTags = function () {
  var tags = {};

  fs.readdirSync('./_posts').forEach(file => {
    var rgxMatchFilename = /\d{4}-\d{2}-\d{2}-.+\.md$/ig;
    var rgxMatchTags = /---[^]*tags:\s*\[?(.*?)\]?\s*\r?\n[^]*---/igm;

    if (!file.match(rgxMatchFilename)) {
      return;
    }

    var match = rgxMatchTags.exec(readFile('./_posts/' + file));
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

var getAllCategories = function () {
  var categories = {};

  fs.readdirSync('./_posts').forEach(file => {
    var rgxMatchFilename = /\d{4}-\d{2}-\d{2}-.+\.md$/ig;
    var rgxMatchCategories = /---[^]*categories:\s*\[?(.*?)\]?\s*\r?\n[^]*---/igm;

    if (!file.match(rgxMatchFilename)) {
      return;
    }

    var match = rgxMatchCategories.exec(readFile('./_posts/' + file));
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

var readFile = function (relativePath) {
  return fs.readFileSync(path.resolve(relativePath), 'utf8');
}

var writeFile = function (relativePath, content) {
  var folder = path.dirname(relativePath);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
  fs.writeFileSync(path.resolve(relativePath), content);
};

gulp.task('server', ['serve']);
gulp.task('serve', function (cb) {
  run('bundle exec jekyll serve --watch');
});

gulp.task('minify-_assign', function (cb) {
  var content = readFile('./_includes/_assign.beauty', 'utf8');
  content = content
    .replace(/\%\}\s+\{\%/ig, '%}{%')
    .replace(/\s+/ig, ' ')
    .replace(/\{\%\s+/ig, '{%')
    .replace(/\s+\%\}/ig, '%}');
  writeFile('./_includes/_assign', content);
  cb && cb();
});

gulp.task('build-dates', function (cb) {
  var dates = getAllDates();
  for (var date in dates) {
    writeFile('./date/' + date + '.md',
      `---
layout: date
title: Posts in {date}
date: {date}
permalink: /{date}/
---`.replace(/\{date\}/ig, date)
    );
  }
  cb && cb();
});

gulp.task('build-tags', function (cb) {
  var content = '',
    tags = getAllTags();
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
  var categories = getAllCategories();
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

gulp.task('clean-dates', function (cb) {
  gulp.src('./date', {
      read: false
    })
    .pipe(clean());
    cb && cb()
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

gulp.task('clean', ['clean-sites', 'clean-dates', 'clean-tags', 'clean-categories'], function (cb) {
  cb && cb();
});

gulp.task('build', ['minify-_assign', 'build-dates', 'build-tags', 'build-categories']);

gulp.task('install-bundler', function (cb) {
  run('gem install bundler', cb)
});

gulp.task('install', ['install-bundler'], function (cb) {
  run('bundle install', cb);
});
