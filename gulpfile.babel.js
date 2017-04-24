'use strict';

import gulp from 'gulp';
import babel from 'gulp-babel';
import sass from 'gulp-sass';
import autoprefixer from 'gulp-autoprefixer';
import notify from 'gulp-notify';
import browserSync from 'browser-sync';

// browserify
import browserify from 'browserify';
import sourcemaps from 'gulp-sourcemaps';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import babelify from 'babelify';
import del from 'del';
//将任务的执行按照顺序
import runSequence from 'run-sequence';
import ejs from 'gulp-ejs';
//正常报错不中断任务流
import plumber from 'gulp-plumber';
import rev from 'gulp-rev';
import revCollector from 'gulp-rev-collector';
import minifyHtml  from 'gulp-minify-html';
import eslint from 'gulp-eslint';
import watchify from 'watchify';
import assign from 'lodash.assign';
import revReplace from 'gulp-rev-replace';
import imagemin from 'gulp-imagemin';
import factor from 'factor-bundle';
import concat from 'concat-stream';
import minifycss from 'gulp-minify-css';
import uglify from 'gulp-uglify';
import gulpif from 'gulp-if';
import cache from 'gulp-cache';

import config from './config.path.js';

//var reload = browserSync.reload;
// gulp.task('clean', del.bind(null, ['.tmp/*/**', 'dist','!.tmp/bundle']));
gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('eslint', function () {
  return gulp.src(['app/client/js/**/*.js'])  //获取目录内全部js文件
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
})

gulp.task('sass', () => { 
  return gulp.src('app/client/sass/**/*.scss') 
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(autoprefixer({
      browsers: ['> 1%', 'not ie <= 8']
    }))
    .pipe(minifycss()) 
    .pipe(sourcemaps.write('.')) 
    .pipe(rev())    
    .pipe(gulp.dest(config.tmpCssPath))
    .pipe(gulp.dest(config.distCssPath))
    .pipe(rev.manifest() )
    .pipe(gulp.dest('.tmp/css'))
    .pipe(notify({ message: 'sass task complete'}));
})

//watch sass 改变 删除原 rev-manfest
gulp.task('css-del', del.bind(null, ['.tmp/css/',]));

//watch js 改变 删除原 rev-manfest
gulp.task('bundle-del', del.bind(null, ['.tmp/bundle/*',]));

// 编译并压缩js
gulp.task('babel',() => {
  return gulp.src('app/client/js/**/*.js')
    .pipe(plumber())
    .pipe(babel())
    .pipe(gulp.dest(config.tmpJsPath))
    .pipe(notify({ message: 'babel task complete' }));
})

gulp.task('html', () => {
  return gulp.src([
    'app/client/html/**/*.html',
    '!app/_global/**/*.html',
    '!app/_partial/**/*.html'
  ])
  .pipe(plumber())
  .pipe(ejs({
    compileDebug: true,
    client: false
  },{ext: '.html'}))
  .pipe(gulpif('*.js', uglify()))
  .pipe(gulp.dest(config.tmpHtmlPath)); 
})

gulp.task('images', function () {
  gulp.src('app/client/image/*.{png,jpg,gif,ico}')
    .pipe(cache(imagemin({
        optimizationLevel: 5, //类型：Number  默认：3  取值范围：0-7（优化等级）
        progressive: true, //类型：Boolean 默认：false 无损压缩jpg图片
        interlaced: true, //类型：Boolean 默认：false 隔行扫描gif进行渲染
        multipass: true //类型：Boolean 默认：false 多次优化svg直到完全优化
    })))
    .pipe(rev())
    .pipe(gulp.dest(config.tmpTmgPath))
    .pipe(gulp.dest(config.distImgPath))
    .pipe(rev.manifest())
    .pipe(gulp.dest(config.tmpTmgPath));
});

gulp.task('fonts', function () {
  return gulp.src('app/client/font/**/*.{eot,svg,ttf,woff,woff2,css}')
    .pipe(gulp.dest('.tmp/font/'))
    .pipe(gulp.dest('dist/font/'));
});

//vender 第三方库放置在.tmp目录下
gulp.task('vender', () => {
  return gulp.src(['app/vender/**/*'])
    .pipe(rev())
    .pipe(gulp.dest('.tmp/libs'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('.tmp/libs'));
})
// gulp.task('js-watch', ['eslint', 'babel']);

//静态文件替换
gulp.task('version', () => {
  return gulp.src(['.tmp/**/*.json', '.tmp/html/**/*.html'])
  .pipe(revCollector({
    // 用来说明模板中已经被替换的文件是否还能再被替换,默认是false
    replaceReved: true,
    //标识目录替换的集合
    dirReplacements: {
      '/css': '/css',
      '/js': '/js/',
      '/bundle': '/bundle/',
      '/image': '/image',
      'libs': config.CDN
    }
  }))
  
  .pipe(gulp.dest(config.tmpHtmlPath));
})

gulp.task('reload', () => {
  browserSync.reload()
});

// The static server
gulp.task('serve', () => {
  browserSync.init({
    server: {
      baseDir: [ '.tmp', './app']
    }
  });

  gulp.watch('app/client/sass/**/*.scss', ['sass-watch']);
  gulp.watch("app/client/js/**/*.js", ['js-watch']);
  gulp.watch("app/**/*.html", ['html-watch']);

});

//watch sass change
gulp.task('sass-watch', () => {
  return runSequence(
    'css-del',
    'sass',
    'version',
    'reload'
  )
})
//watch js change
gulp.task('js-watch', () => {
  return runSequence(
    'bundle-del',
    'browserify',
    'rev-bundle',
    'version',
    'reload'
  )
})
//watch html change
gulp.task('html-watch', () => {
  return runSequence(
    'html',
    'version',
    'reload'
  )
})

//使用watchify加快browerify构建速度
var customOpts = {
  entries: config.es6EntryPath,
  debug: true
}

var opts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts)); 

b.transform("babelify", {presets: ["es2015"]});

b.plugin(factor, {
  o: config.es6OutPath
});

function bundle() {
  return b.bundle()
  .pipe(source('es6common.js'))
  .pipe(buffer()) 
  .pipe(gulp.dest(config.tmpBundlePath))
}
  // .pipe(buffer()) //将vinyl对象内容中的Stream转换为Buffer
  // .pipe(sourcemaps.init({loadMaps: true}))
  // .pipe(sourcemaps.write('.'))
  // .pipe(rev())
  // .pipe(gulp.dest('.tmp/bundle'))
  // .pipe(rev.manifest())
  // .pipe(gulp.dest('.tmp/bundle'));


//将输出接口添rev-manifest文件
gulp.task('rev-bundle', () => {
  return gulp.src(config.tmpBundlePath + '/*.js')
    .pipe(rev())
    .pipe(gulp.dest(config.tmpBundlePath))
    .pipe(rev.manifest())
    .pipe(gulp.dest(config.tmpBundlePath))
})

//browserify将es转换成浏览器脚本代码
gulp.task('browserify', ['eslint', 'babel'], bundle)

gulp.task('res', () => {
  gulp.src('app/client/res/*')
    .pipe(gulp.dest('.tmp/res'))
    .pipe(gulp.dest('dist/res'))
})

gulp.task('default', () => {
  return runSequence(
    'clean',
    'sass',
    'images',
    'fonts',
    'vender',
    'html',
    'browserify', 
    'rev-bundle' , 
    'version',
    'serve'
  );
})

gulp.task('dist:clean', del.bind(null, ['dist']));

gulp.task('dist:version', () => {
  return gulp.src(['.tmp/**/*.json', '.tmp/html/**/*.html'])
  .pipe(revCollector({
    // 用来说明模板中已经被替换的文件是否还能再被替换,默认是false
    replaceReved: true,
    //标识目录替换的集合
    dirReplacements: {
      '/css'   : '../../css',
      '/bundle': '../../bundle',
      '/image' : '../../image',
      '/libs': '../../libs'
    }
  }))
  .pipe(minifyHtml({ 
    empty: true,
    spare: true 
  }))
  .pipe(gulp.dest(config.distHtmlPath));
})

// gulp.task('dist:html', () => {
//   return gulp.src('.tmp/html/**/*.html')
//     .pipe(gulp.dest(config.distHtmlPath))
// })

gulp.task('dist:bundle', () => {
  return gulp.src(['.tmp/bundle/*.js', '.tmp/bundle/*.js.map'])
    .pipe(uglify()) 
    .pipe(gulp.dest(config.distBundlePath))
})

gulp.task('dist:libs', () => {
  return gulp.src(['.tmp/libs/**/*'])
    .pipe(gulp.dest('dist/libs'))
})

//gulp 运行之后执行
gulp.task('build', ['dist:clean'], () => {
  return runSequence(
    'sass',
    'fonts',
    'res',
    'images',  
    //'dist:version',
    //'dist:html',
    'dist:bundle',
    'dist:libs'   
  )
})




