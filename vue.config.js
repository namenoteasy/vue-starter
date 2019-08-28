const path = require('path')
if (process.env.NODE_ENV === 'development') {
  require(path.resolve('src/core/compiler/dev.js'))
} else {
  require(path.resolve('src/core/compiler/build.js'))
}

module.exports = {

    transpileDependencies:[
        // other js file
    ],
    css: {
        loaderOptions: {
            less: {
                javascriptEnabled: true,
            }
        }
    },
    devServer: {
        before: app=>{
            //app.use('/api',mockRouter);
            // require('./_mock/index.ts');
            // mockRouter
        },//require('_mock/index'),
    },
    pages: {
        index: {
          entry: 'src/core/main.ts'
        }
      },
    chainWebpack: config => {

        /*
        config.module
            .rule('tsx')
            .test(/\.tsx?$/)
            .use('tslint-loader')
                .loader('tslint-loader');

        config.module
            .rule('vuetsx')
            .test(/\.tsx?$/)
            .use('babel-loader')
                .loader('babel-loader')
                .tap(opt=>{
                    opt={};
                    Object.assign(opt,{
                        appendTsxSuffixTo: [/\.vue$/]
                    });
                    return opt;
                });
                */
    },
    configureWebpack: config => {

        /*
        Object.assign(config, {
            // 开发生产共同配置
            resolve: {
                extensions: ['.js', '.vue', '.json', '.ts', '.tsx']

            }
        });
        */
    }
}
