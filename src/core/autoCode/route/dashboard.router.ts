import MainLayout from '../layout/main/index.vue';

const router = {
    path: '',
    component: MainLayout,
    name: '/',
    meta: {
        title: '工作台',
        icon: 'dashboard',
        routerGuard: true,
        i18n: `menu.dashboard`,
    },
  };

export default router;
