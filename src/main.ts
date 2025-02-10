import { createSSRApp } from "vue";
import { createPinia } from "pinia";
import NavBar from './components/common/nav-bar.vue'
import PageTransition from './components/common/page-transition.vue'
import App from "./App.vue";

export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();
  app.use(pinia);
  
  // 注册全局组件
  app.component('NavBar', NavBar)
  app.component('PageTransition', PageTransition)
  
  return {
    app,
    pinia
  };
}
