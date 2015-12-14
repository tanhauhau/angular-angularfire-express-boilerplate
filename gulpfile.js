// FOUNDATION FOR APPS TEMPLATE GULPFILE
// -------------------------------------
// This file processes all of the assets in the "client" folder, combines them with the Foundation for Apps assets, and outputs the finished files in the "build" folder as a finished app.

// 1. LIBRARIES
// - - - - - - - - - - - - - - -

var $        = require('gulp-load-plugins')({
    pattern: ['gulp-*', 'uglify-save-license', 'run-sequence']
});
var argv     = require('yargs').argv;
var gulp     = require('gulp');
var cleandir = require('clean-dir');
var wiredep = require('wiredep');
var lazypipe = require('lazypipe');

// Check for --production flag
var isProduction = !!(argv.production);

// 2. FILE PATHS
// - - - - - - - - - - - - - - -

var paths = {
    assets: [
        './client/**/*.*',
        '!.client/images/**/*',    //no images
        '!./client/**/index.html', //no index html
        '!./client/**/*.js',       //no js
        '!./development/**/*.css', //no css
    ],
    // Sass will check these folders for files when you use @import.
    appCSS: [
        './client/**/*.css',
    ],
    // These files are for your app's JavaScript
    appJS: [
        './client/**/*.js',
    ],
    appImage: [
        './client/images/**/*',
    ]
};

//2.1 WIREDEP config
// - - - - - - - - - - - - - - -
var wiredepConfig = {
    dependencies: true,
    cwd: '',
};

// 3. TASKS
// - - - - - - - - - - - - - - -

// Cleans the build directory
gulp.task('clean', function(cb) {
    cleandir('./build', cb);
});

// Copies everything in the client folder except templates, Sass, and JS
gulp.task('copy:assets', function() {
    return gulp.src(paths.assets, {
        base: './client/'
    })
    .pipe(gulp.dest('./build'))
    .pipe($.size());
});

gulp.task('copy:js', function(cb) {
    var uglifyTask = lazypipe()
        .pipe($.angularFilesort)
        .pipe($.concat, 'app.js')
        .pipe($.uglify, {preserveComments: $.uglifySaveLicense});
    var uglifyIf = $.if(isProduction, uglifyTask()
    .on('error', function(e){
        console.log(e);
    }));
    return gulp.src(paths.appJS)
        .pipe($.ngAnnotate({single_quotes: true}))
        .pipe(uglifyIf)
        .pipe(gulp.dest('./build'))
        .pipe($.size());
});

gulp.task('copy:css', function(cb) {
    return gulp.src(paths.appCSS)
        .pipe($.csso())
        .pipe(gulp.dest('./build'))
        .pipe($.size());
});

gulp.task('copy:images', function () {
    return gulp.src(paths.appImage)
    .pipe($.cache($.imagemin({
        optimizationLevel: 3,
        progressive: true,
        interlaced: true
    })))
    .pipe(gulp.dest('./build/images'))
    .pipe($.size());
});

// gulp.task('copy:fonts', function() {
//     return gulp.src(['./bower_components/components-font-awesome/fonts/*'])
//             .pipe(gulp.dest('./build/fonts/'));
// });

//inject scripts and css dependencies to index.html
gulp.task('vendor-scripts', function() {
    return gulp.src(wiredep(wiredepConfig).js)
        .pipe(gulp.dest('build/vendor'))
        .pipe($.size());
});

gulp.task('vendor-css', function() {
    return gulp.src(wiredep(wiredepConfig).css)
        .pipe(gulp.dest('build/vendor'))
        .pipe($.size());
});

gulp.task('wiredep:direct', function() {
    return gulp.src('./client/index.html')
        .pipe(wiredep.stream({
            cwd: '',
            fileTypes: {
                html: {
                    replace: {
                        js: function(filePath) {
                            return '<script src="' + 'vendor/' + filePath.split('/').pop() + '"></script>';
                        },
                        css: function(filePath) {
                            return '<link rel="stylesheet" href="' + 'vendor/' + filePath.split('/').pop() + '" type="text/css"/>';
                        }
                    }
                }
            }
        }))
        .pipe($.inject(
            gulp.src(['./build/**/*.js', '!./build/vendor/**/*.js']).pipe($.angularFilesort()), {
                addRootSlash: false,
                transform: function(filePath, file, i, length) {
                    return '<script src="' + filePath.replace('build/', './') + '"></script>';
                }
        }))
        .pipe($.inject(
            gulp.src(['./build/**/*.css', '!./build/vendor/**/*.css'], { read: false }), {
                addRootSlash: false,
                transform: function(filePath, file, i, length) {
                    return '<link rel="stylesheet" href="' + filePath.replace('build/', './') + '" type="text/css"/>';
                }
        }))
        .pipe(gulp.dest('build'));
});

gulp.task('copy', ['copy:assets', 'copy:js', 'copy:css', 'copy:images']);
gulp.task('vendor', ['vendor-scripts', 'vendor-css']);

gulp.task('wiredep', ['copy', 'vendor'], function(cb) {
    $.runSequence('wiredep:direct', cb);
});

gulp.task('server', ['build'], function() {
    var server = $.liveServer.new('express.js');
    server.start();

    gulp.watch('build/**/*.*', function (file) {
      server.notify.apply(server, [file]);
    });
    gulp.watch('express.js', function(){
        $.util.log("Stoping server..");
        server.stop()
        .then(function(){
            $.util.log("Server Stopped.");
            $.util.log("Restarting Server..");
            server.start();
            $.util.log("Server Restarted..");
        });
    });
});

// Builds your entire app once, without starting a server
gulp.task('build', function(cb) {
    $.runSequence('clean', ['copy', 'vendor'], 'wiredep', cb);
});

// Default task: builds your app, starts a server, and recompiles assets when they change
gulp.task('default', ['server'], function () {

    //watch deleted file / folder
    $.watch(['./client/**/*.*', '!./client/**/*.*~', './client/**/'], {events: ['unlink', 'unlinkDir']}, function(file){
        if (file !== null) {
            var deletefile = './www/'+file.relative;
            trash([deletefile])
            .then(function(){
                console.log("deleted " + deletefile);
            });
        }
    });
    //watch add/change file
    $.watch(paths.appJS, {events: ['add', 'change']}, function(){
        $.runSequence('copy:js', 'wiredep');
    });
    $.watch(paths.appCSS, {events: ['add', 'change']}, function(){
        $.runSequence('copy:css', 'wiredep');
    });
    $.watch(paths.appImage, {events: ['add', 'change']}, function(){
        $.runSequence('copy:images', 'wiredep');
    });
    $.watch(paths.assets, {events: ['add', 'change']}, function(){
        $.runSequence('copy');
    });
    $.watch(['./bower_components/*', './bower.json'], {events: ['add', 'change']}, function(){
        $.runSequence('wiredep');
    });
    $.watch('./client/index.html', {events: ['add', 'change']}, function(){
        $.runSequence('wiredep:direct');
    });
});
