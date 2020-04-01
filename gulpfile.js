'use strict';

var gulp = require('gulp'),
    pug = require('gulp-pug'), // Припроцесор HTML
    browserSync = require('browser-sync'),// Серсер для обновлення і синхронізації сторінки
    concat = require('gulp-concat'),
    sourcemaps = require('gulp-sourcemaps'),// плагін для побудови карт в scss і js
    uglify = require('gulp-uglifyjs'),
    csso = require('gulp-csso'),
    rename = require('gulp-rename'),
    del = require('del'),  // для видалення попок файлів
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    sass = require('gulp-sass'),
    cache = require('gulp-cache'),
    plumber = require("gulp-plumber"), // щоб ловити помилки в потоці
    notify = require("gulp-notify"),
    //newer = require("gulp-newer"),
    autoprefixer = require('gulp-autoprefixer'),// плагін для css добаляє префікси до різних браузерів
    imageminJpegRecompress = require("imagemin-jpeg-recompress"),
    webp = require("gulp-webp"),
    svgmin = require("gulp-svgmin"),
    cheerio = require("gulp-cheerio"),
    replace = require("gulp-replace"),
    svgSprite = require("gulp-svg-sprite");

var way = {
  "root": "./public",
  "theme": "frontend/pug/pages/*.pug",
  "style": "frontend/style/main.scss",
  "image": "frontend/image/**/*.{jpg,png,svg}",
  "imageOnli": "frontend/image",
  "script": "frontend/js/**/*.js",
  "svg": "frontend/image/icons/*.svg",
};

//бібліотеки які нам потрібні і всі js файли
var js = [
  'frontend/js/libs/jquery-3.1.1.min.js'
];

// Стилі ----------------
gulp.task('scss', function () {
  return gulp.src([
    way.style
  ])
    .pipe(plumber({
      errorHandler: notify.onError(function (err) {
        return {
          title: "Стилі",
          message: "Накосячив з стилями блін: " + err.message
        }
      })
    }))
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(autoprefixer(['last 2 version']))
    .pipe(csso())
    .pipe(rename('style.min.css'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(way.root + "/style"))
    .pipe(browserSync.stream());
	/*.pipe(browsersync.reload({
	 stream: true
	 }))*/
  ;
});

// Работа с Pug---------------
gulp.task('pug', function () {
  return gulp.src([way.theme])
    .pipe(plumber({
      errorHandler: notify.onError(function (err) {
        return {
          title: "HTML",
          message: "Помилка в PUG: " + err.message
        }
      })
    }))
    .pipe(pug({
      pretty: true
    }))
    .pipe(gulp.dest(way.root));
});

// JS--------------
gulp.task('scripts', function () {
  return gulp.src(way.script)
    //.pipe(concat('libs.min.js'))
    //.pipe(uglify())
    .pipe(gulp.dest(way.root + '/js'));
  // .pipe(browsersync.reload({
  //   stream: true
  // }));
});


gulp.task('allimg', function () {
  return gulp.src(way.imageOnli + '/**/*.{jpg,png,svg}')
    .pipe(gulp.dest(way.root + '/image'));
});

//image otimi --------------
gulp.task('image', function () {
  return gulp.src(way.image)
    .pipe(imagemin([
      imagemin.jpegtran({ progressive: true }),
      imageminJpegRecompress({
        loops: 5,
        min: 65,
        max: 70,
        quality: 'medium'
      }),
      imagemin.optipng({ optimizationLevel: 3 }),
      pngquant({ quality: '65-70', speed: 5 }),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest(way.root + '/image'));
})
//---------------------------
gulp.task('webp', function () {
  return gulp.src(way.imageOnli + '/**/*.{png,jpg}')
    .pipe(webp({ quality: 90 }))
    .pipe(gulp.dest(way.root + '/image'));
});

//----------------------
gulp.task('svg', function () {
  return gulp.src(way.svg)
    .pipe(svgmin({
      js2svg: {
        pretty: true
      }
    }))
    .pipe(cheerio({
      run: function ($) {
        $('[fill]').removeAttr('fill');
        $('[stroke]').removeAttr('stroke');
        $('[style]').removeAttr('style');
      },
      parserOptions: { xmlMode: true }
    }))
    .pipe(replace('&gt;', '>'))
    // build svg sprite
    .pipe(svgSprite())
    .pipe(gulp.dest(way.root + '/image/icons'));
});

//icon
gulp.task('icon-little', function () {
  return gulp.src('frontend/style/icon/**/*.*')
    .pipe(gulp.dest(way.root + '/style/icon'));
})


gulp.task("server", function () {
  browserSync.init({
    server: way.root
  });

  browserSync.watch(way.root + "/**/*.*").on("change", browserSync.reload);
});

// Видалення кешу
gulp.task('clearCache', function () {
  return cache.clearAll();
});

// Видалення папик
gulp.task("clear", function () {
  return del(way.root);
});

gulp.task("watch", function () {
  gulp.watch("frontend/style/**/*.scss", gulp.series("scss"));
  gulp.watch("frontend/js/**/*.js", gulp.series("scripts"));
  gulp.watch("frontend/pug/**/*.pug", gulp.series("pug"));
  gulp.watch("frontend/image/**/*.*", gulp.series("image"));
  gulp.watch("frontend/style/icon/**/*.*", gulp.series("icon-little"));
});

gulp.task("build", gulp.series("pug", "scss", "scripts", "image", 'webp', 'svg'));

gulp.task("default", gulp.series("clear", "build", gulp.parallel("watch", "server")))