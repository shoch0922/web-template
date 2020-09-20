const gulp = require('gulp');
const gulpIf = require('gulp-if')
const webpackStream = require("webpack-stream");
const webpack = require("webpack");
const webpackConfig = require("./webpack.config.js");
const autoprefixer = require("gulp-autoprefixer");
const plumber = require("gulp-plumber");
const sass = require("gulp-sass");
const cssmin = require("gulp-cssmin");
const del = require("del");
const minimist = require("minimist");
const browserSync = require("browser-sync");
const eslint = require('gulp-eslint');
const { reload } = require('browser-sync');


// コマンドラインオプション
const options = minimist(process.argv.slice(2), {
	default: {
		P: false
	}
});

// 初期設定情報
const conf = {
	// プロキシする場合に設定
	port: null,
	// 出力先
	out: "./public/",
	// autoprefixer
	prefix: null
}

function isFixed(file) {
	return file.eslint != null && file.eslint.fixed
}

function lint(done) {
	let paths = ["./src/ts/"]

	for(let i = 0; i < paths.length; i++) {
		gulp.src(paths[i] + '**/*.ts')
			.pipe(eslint({ useEslintrc: true, fix: true })) // .eslintrc を参照
			.pipe(eslint.format())
			.pipe(gulpIf(isFixed, gulp.dest(paths[i])))
			.pipe(eslint.failAfterError())
	}

	done();
}

// サーバー設定
function server () {
	// プロキシの場合
	if(conf.port) {
		browserSync.init({
			proxy: {
				target: "http://localhost:" + conf.port,
				ws: true
			},
			notify: false,
			ghostMode: false
		});
	// プロキシ無しの場合
	} else {
		browserSync.init({
			server: {
				baseDir: "./public/"
			}
		});
	}
}

function BrReload(done) {
	browserSync.reload();
	done()
}

// webpack
function tsBuild() {
	let config = webpackConfig;
	config.entry.main = "./src/ts/main.ts";
	config.output.filename = "app.js";

	if(options.P) {
		config.mode = "production";
	}

	return webpackStream(config, webpack)
		.on("error", function (e) {
		this.emit("end");
		})
		.pipe(gulp.dest(conf.out + "assets/js/"));
}

// sass
function sassBuild() {
	return gulp
		.src("./src/scss/style.scss")
		.pipe(sass())
		.pipe(plumber())
		.pipe(cssmin())
		.pipe(autoprefixer(conf.prefix))
		.pipe(gulp.dest(conf.out + "assets/css/"));
}

// copy
function copy(done) {
	gulp.src(["./src/html/**/*"]).pipe(gulp.dest(conf.out));
	gulp.src(["./src/assets/**/*"]).pipe(gulp.dest(conf.out + "assets"));
	browserSync.reload();
	done();
}

// clean
function clean(done) {
	del([conf.out]).then(function() {
		done();
	})
}

// watch
function watch() {
	gulp.watch("./src/ts/**/*", gulp.series(tsBuild, BrReload));
	gulp.watch("./src/scss/*.scss", gulp.series(sassBuild, BrReload));
	gulp.watch(["./src/assets/**/*", "./src/html/**/*"], gulp.series(copy, BrReload));
}

exports.default = gulp.series(
	clean,
	gulp.parallel(tsBuild, sassBuild),
	copy,
	gulp.parallel(server, watch)
);

exports.lint = gulp.task(lint)