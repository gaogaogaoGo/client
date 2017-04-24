
'use strict';

module.exports = exports = {

	tmpHtmlPath: '.tmp/html',
  //生产环境下html目录
	distHtmlPath: 'dist/html',

	tmpTmgPath: '.tmp/image',
  //生产环境下img目录
	distImgPath: 'dist/Image',

  tmpCssPath: '.tmp/css',
  //生产环境下css目录
	distCssPath: 'dist/css',

	//开发环境下css目录
	tmpJsPath: '.tmp/bundle/js',
	//生产环境下css目录
	// distJsPath: '.tmp/js',

	//browserify 生成的bundle.js开发目录
	tmpBundlePath: '.tmp/bundle',
	//browserify 生成的bundle.js生产目录
	distBundlePath: 'dist/bundle',

	CDN: 'libs/',

	//es6的入口文件存放位置
	es6EntryPath: [
		'app/client/js/jsEntry/main.js', //common 
		'app/client/js/jsEntry/home.js'	
	],
	//es6的输出文件存放位置，与es6EntryPath文件名对应
	es6OutPath: [
		'.tmp/bundle/main.js',
		'.tmp/bundle/home.js'
	]
};

