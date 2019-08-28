import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { State, Mutation, namespace } from 'vuex-class';
// app 模块
const appModule = namespace('app');
// 复用tab模块
const reuseTabModule = namespace('reuseTab');

import * as _ from 'lodash';

export default class MainLayout extends Vue {
  private hello: string = '首页';
  constructor() {
    super();
  }
}