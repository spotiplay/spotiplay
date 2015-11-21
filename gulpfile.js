var gulp = require('gulp'),
    clean = require('gulp-clean'),
    runSequence = require('run-sequence'),
    cssmin = require('gulp-cssmin'),
    debug = require('gulp-debug'),
    inject = require('gulp-inject'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    addsrc = require('gulp-add-src');

/*    gutil = require('gulp-util'),
    rename = require('gulp-rename'),
    watch = require('gulp-watch'),
    htmlreplace = require('gulp-html-replace'),
    series = require('stream-series'),
    replace = require('gulp-replace-task'),
    obfuscate = require('gulp-obfuscate'),
    replace = require('gulp-regex-replace'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    strip = require('gulp-strip-comments')
    */

 
var outputFolder = "build";



gulp.task('default1', function() {
    runSequence(
        'removeTestData',
        'uglify:controllers',
        'uglify:factories',
        'uglify:rest',
        'uglify:services',
        'uglify:libs',
        'cssmin',
        'cleanHtml', 'removeSources', 'changeName');
});

gulp.task('default', function() {
    runSequence(
        'cleanBuildFolder',
        'cssmin',
        'build_js',
        'copy_static',
        'index'
/*        'uglify:factories',
       'uglify:rest',
        'uglify:services',
        'uglify:libs',

        'cleanHtml',
        'removeSources',
     'changeName'
 */
    );
});

gulp.task('cleanBuildFolder', function() {
    return gulp.src(outputFolder+'/*')
        .pipe(clean());
});
gulp.task('cssmin', function () {
    return gulp.src('app/assets/*.css')
        //.pipe(debug({title: 'KORN:'}))
        .pipe(concat('css.css'))
        .pipe(cssmin())
        .pipe(gulp.dest(outputFolder));
});

gulp.task('build_js', function() {
    return gulp.src('app/src/init.js')
        .pipe(addsrc.append('app/src/*/**/*.js'))
        .pipe(concat('scripts.js'))
        .pipe(uglify())
        .pipe(addsrc.prepend('app/src/license.js'))
        .pipe(addsrc.append('app/assets/lib/**/*.js'))
        .pipe(concat('scripts.js'))
        .pipe(gulp.dest(outputFolder));
});

gulp.task('final_js', function() {
    var scripts_to_merge = [
        outputFolder+'/own_scripts.js',
        'app/assets/lib/**/*.js'
    ];

    return gulp.src(scripts_to_merge)
        .pipe(concat('scripts.js'))
        .pipe(uglify())
        .pipe(gulp.dest(outputFolder));
});

gulp.task('copy_static', function(){
    var filesToCopy = [
        './app/src/**/*.html',
        './app/favicon.ico',
        './app/assets/demo-data/*.json',
        './app/assets/*.png',
        './app/assets/*.jpg',
        './app/assets/lib/angular-material.min.css'
    ];
    gulp.src(filesToCopy, { base: './app/' })
        .pipe(gulp.dest(outputFolder));
});
gulp.task('copy_cname', function(){
    gulp.src('./CNAME')
        .pipe(gulp.dest(outputFolder));
});
gulp.task('index', function() {
    var sources = gulp.src([
        './'+outputFolder+'/scripts.js',
        './'+outputFolder+'/css.css'
    ], {read: false});

    return gulp.src('./app/index.html')
        .pipe(gulp.dest('./'+outputFolder))
        .pipe(inject(sources, {relative: true}))
        .pipe(gulp.dest('./'+outputFolder));
});



 


gulp.task('uglify:libs', function() {
  return gulp.src(projectDir + 'js/libs/*.js')
    .pipe(uglify())
    .pipe(gulp.dest(projectDir + 'js/libs/'));
});



gulp.task('changeName', function() {
  return gulp.src(projectDir + 'config.xml')
      .pipe(replace({regex:'dubink-dev', replace:'dubink'}))
      .pipe(replace({regex:'dub-dev', replace:'dub.ink'}))
      .pipe(gulp.dest(projectDir));
});

gulp.task('removetodo', function() {
  return gulp.src(projectDir + 'js/libs/*.js')
    .pipe(uglify())
    .pipe(gulp.dest(projectDir + 'js/libs'));
});

gulp.task('makeFavicon', function () {
    gulp.src('icon_1024_transparent.png')
        .pipe(favicons({
            files: { dest: 'images/' },
            settings: { background: '#1d1d1d' }
        }))
        .pipe(gulp.dest('./'));
});
 
gulp.task('cleanHtml', function() {
  return gulp.src(projectDir + 'index.html')
    .pipe(htmlreplace({
        'js': ''
    }))
    .pipe(gulp.dest(projectDir));
});

gulp.task('imagemin', function () {
    return gulp.src('nepotom/res/screen/ios/*')
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('afterObfuscation', function() {
  runSequence('removeComments', 'injectFiles');
});


