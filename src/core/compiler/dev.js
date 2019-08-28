const gulp = require('gulp')
const fs = require('fs')
const path = require('path')
const utils = require('./business-utils.js')
utils.delDir()
utils.moveAllFile()
let watch = gulp.watch(['src/**/*.*', '!src/core/**/*.*'])
let changeTimeout
watch.on('change', function (path, state) {
  if (/.vue$/.test(path)) {
    utils.moveVueFile(path)
    return
  }
  utils.moveOtherFile(path)
})
watch.on('unlink', function (path) {
  clearTimeout(changeTimeout)
  changeTimeout = setTimeout(function () {
    fs.unlinkSync(path.replace(/^src/, 'src/core/autoCode'))
    utils.moveAllFile()
  }, 100)
})
watch.on('add', function () {
  clearTimeout(changeTimeout)
  changeTimeout = setTimeout(function () {
    utils.moveAllFile()
  }, 100)
})