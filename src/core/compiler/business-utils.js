const utils = require('./base-utils.js')
const glob = require("glob")
const PATH = require('path')
const fs = require('fs')
const vueFileTemplate = fs.readFileSync(PATH.resolve('src/core/compiler/vueFileTemplate.vue')).toString()
const routerTemplate = fs.readFileSync(PATH.resolve('src/core/compiler/routerFileTemplate.js')).toString()
module.exports = {
  distPath: 'src/core/autoCode',
  delDir () {
    utils.delDir(this.distPath)
  },
  copyFile (path, fileHandler) {
    let files = glob.sync(path)
    files.forEach(p => utils.copy(p, p.replace(/^src/, this.distPath), fileHandler))
    return files
  },
  moveAllFile () {
    this.moveIndexFile()
    this.moveVueFile()
    // this.moveOtherFile()
    // this.newComponent()
  },
  moveOtherFile (path) {
    // 移动其他资源
    this.copyFile(path || 'src/**/*.!(vue|ts)')
  },
  moveIndexFile (path) {
    this.copyFile(path || 'src/!(core)/**/index.ts')
  },
  newComponent () {
    let vueFiles = glob.sync(this.distPath + '/**/index.vue')
    // 根据目录结构过滤、获取合法的 index.vue 文件，并且目录结构所能体现的信息
    vueFiles = vueFiles.map(function (vuePath) {
      if (/^src.core.autoCode.+[\\\/]([^\\\/]*?).index.vue$/.test(vuePath)) {
        let name = RegExp.$1
        let isBaseComponent = false
        let isBusinessComponent = false
        let isSubComponent = false
        let isRootPage = false
        let isSubPage = false
        let isPagePrivateComponent = false
        switch (true) {
          // 基础组件
          case /^src.core.autoCode.base-components.[^\\\/]*?.index.vue$/.test(vuePath):
            isBaseComponent = true
            break
          // 基础组件
          case /^src.core.autoCode.business-components.[^\\\/]*?.index.vue$/.test(vuePath):
            isBusinessComponent = true
            break
          case /^src.core.autoCode.[^\.]*components.+components.[^\\\/]*?.index.vue$/.test(vuePath):
            isSubComponent = true
            break
          case /^src.core.autoCode.pages.[^\\\/]*?.index.vue$/.test(vuePath):
            isRootPage = true
            break
          case /^src.core.autoCode.pages.+components.[^\\\/]*?.index.vue$/.test(vuePath):
            isPagePrivateComponent = true
            break
          case /^src.core.autoCode.pages.+children.[^\\\/]*?.index.vue$/.test(vuePath):
            isSubPage = true
            break
        }
        return {
          name,
          path: vuePath,
          isBaseComponent,
          isBusinessComponent,
          isSubComponent,
          isRootPage,
          isSubPage,
          isPagePrivateComponent,
          parentPath: '', // 父级组件是什么，这里还没能给出，下文再赋值
        }
      }
      return false
    }).filter(item => item)
    let baseComponent = vueFiles.filter(item => item.isBaseComponent)
    let businessComponent = vueFiles.filter(item => item.isBusinessComponent)
    let subComponent = vueFiles.filter(item => item.isSubComponent)
    let rootPage = vueFiles.filter(item => item.isRootPage)
    let subPage = vueFiles.filter(item => item.isSubPage)
    let pagePrivateComponent = vueFiles.filter(item => item.isPagePrivateComponent)
  
    // 路由
    {
      let routerStr = routerTemplate
      // diff 全是按需引入的，不需要提前 import
      // routerStr = this.replaceTemplate(routerStr, 'import vue file', function (template) {
      //   let result = ''
      //   // 在 auto-router 中引入这些 vue 文件
      //   vueFiles.forEach(item => {
      //     result += template.replace(/%name/g, item.name).replace(/%path/g, PATH.relative(PATH.resolve('src/core/auto-router.ts'), item.path).replace(/\\/g, '/').replace(/^\.\.\//, './'))
      //   })
      //   return result
      // })
      routerStr = this.replaceTemplate(routerStr, 'routes object', function (template) {
        let result = ''
        // 页面注册
        rootPage.forEach(item => {
          if (item.name === 'index') {
            result += registerPage(item).replace(/%children/g, '').replace(/(\n\s*path:\s*')\/index(',)/, '$1/$2')
          } else {
            result += registerPage(item).replace(/%children/g, '')
          }
        })
        function registerPage (parent, parentName = '') {
          let name = (parentName + '/' + parent.name).replace(/^[\\\/]/, '')
          let temp = template.replace(/%name/g, name).replace(/%path/g, PATH.relative(PATH.resolve('src/core/autoCode/auto-router.ts'), parent.path).replace(/\\/g, '/').replace(/^\.\.\//, './'))
          // 相应子页面注册
          let subs = subPage.filter(subItem => {
            return /^children.[^\\\/]*?.$/.test(subItem.path.replace(/index.vue$/, '').replace(parent.path.replace(/index.vue$/, ''), ''))
          })
          if (subs.length) {
            subs.forEach(sub => {
              let subTemp = registerPage(sub, name)
              temp = temp.replace('%children', subTemp + '%children')
            })
          }
          return temp
        }
        return result
      })
      fs.writeFileSync(PATH.resolve('src/core/autoCode/auto-router.ts'), routerStr)
    }
  
    // 组件
    {
      // vue是有全局组件这么个说法的，技术上完全可行，但是业务上并不期望有全局组件
      // 页面里、页面的私有组件可以使用 src/components 下的所有组件，但是 src/components 里并不能使用 src/components 下的根组件
      // 更容易理解的说法是：不允许同级组件相互调用
      let tempType = 'import components file'
      let registerTemp = indexFileTemplate.match(new RegExp(`\\/\\*${tempType} template:([\\s\\S]*?)\\*\\/`))
      registerTemp = (registerTemp && registerTemp[1]) || ''
      rootPage.concat(subPage).concat(pagePrivateComponent).forEach(pageItem => {
        let componentTemp = ''
      
        // 清空组件配置
        let itemPath = PATH.resolve(pageItem.path).replace(/[^\\\/]+$/, 'index.ts')
        let pageTemplate = fs.readFileSync(itemPath).toString()
        pageTemplate = this.replaceTemplate(pageTemplate, 'import components file', () => '\n')
      
        // 注册全局组件
        baseComponent.forEach(item => {
          componentTemp += registerComponent.call(this, item, pageItem, 'base')
        })
        businessComponent.forEach(item => {
          componentTemp += registerComponent.call(this, item, pageItem, 'business')
        })
      
        // 注册私有组件
        let pcs = pagePrivateComponent.filter(item => {
          return /^components.[^\\\/]*?.$/.test(item.path.replace(/index.vue$/, '').replace(pageItem.path.replace(/index.vue$/, ''), ''))})
        if (pcs.length) {
          pcs.forEach(pc => {
            componentTemp += registerComponent.call(this, pc, pageItem, 'private')
          })
        }
        fs.writeFileSync(itemPath, this.replaceTemplate(pageTemplate, 'import components file', () => componentTemp))
      })
      // src/components/ 里的组件
      baseComponent.concat(businessComponent).forEach(rpItem => {
        let componentTemp = ''
      
        // 清空组件配置
        let itemPath = PATH.resolve(rpItem.path).replace(/[^\\\/]+$/, 'index.ts')
        let pageTemplate = fs.readFileSync(itemPath).toString()
        pageTemplate = this.replaceTemplate(pageTemplate, 'import components file', () => '\n')
      
        // 注册基础组件
        if (rpItem.isBusinessComponent) {
          baseComponent.forEach(item => {
            componentTemp += registerComponent.call(this, item, rpItem, 'base')
          })
        }
        
        // 注册私有组件
        let srps = subComponent.filter(item => {
          return /^components.[^\\\/]*?.$/.test(item.path.replace(/index.vue$/, '').replace(rpItem.path.replace(/index.vue$/, ''), ''))})
        if (srps.length) {
          srps.forEach(srp => {
            componentTemp += registerComponent.call(this, srp, rpItem, 'private')
          })
        }
        fs.writeFileSync(itemPath, this.replaceTemplate(pageTemplate, 'import components file', () => componentTemp))
      })
      function registerComponent (component, page, type = '') {
        return registerTemp.replace(/%name/g, type + '-' + component.name).replace(/%path/g, PATH.relative(PATH.resolve(page.path), component.path).replace(/\\/g, '/').replace(/^\.\.\//, './'))
      }
    }
  },
  moveVueFile (path) {
    let that=this
    let jsFiles = glob.sync('src/!(core)/**/*.ts')
    // 处理 vue 文件，并复制到 autoCode 目录
    this.copyFile(path || 'src/!(core)/**/index.vue', function (from, buffer, to) {
      let dir = PATH.resolve(from).replace(/[^\/\\]+\.vue$/, '')
      let currentDirJs = {}
      jsFiles.forEach(jsPath => {
        jsPath = PATH.resolve(jsPath)
        let isSameDir = new RegExp(dir.replace(/\\/g, '\\\\') + '[^\\/\\\\]+\\.ts$')
        if (!isSameDir.test(jsPath)) return
        let jsName = jsPath.match(/[^\/\\]+\.ts/)
        jsName = jsName && jsName[0]
        if (!jsName) return
        currentDirJs[jsName] = jsPath
      })
      let vueContent = buffer.toString()
      if (!currentDirJs['index.ts']) { 
        console.error('缺少定义组件的index文件')
        return 
      }
      vueContent = vueFileTemplate
      .replace(/%template%/, vueContent)

      return Buffer.from(vueContent)
    })
  },
  
  replaceTemplate(content, type, templateHandler) {
    let template = content.match(new RegExp(`\\/\\*${type} template:([\\s\\S]*?)\\*\\/`))
    template = (template && template[1]) || ''
    template = templateHandler(template)
    return content.replace(new RegExp(`(\\/\\*start:${type}\\*\\/)[\\s\\S]*?(\\/\\*end:${type}\\*\\/)`, 'g'), `$1\n${template}$2`)
  }
}