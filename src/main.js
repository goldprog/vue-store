import Vue from "vue";
import App from "./App.vue";
import Vuex from "./store";
Vue.use(Vuex);

Vue.use(Vuex);

const pageM = {
  state: {
    count: 10001
  },
  getters: {
    test(state) {
      return state.count + 1;
    }
  }
};
const pageA = {
  modules: {
    m: pageM
  },
  state: {
    count: 100
  },
  getters: {
    gettestA(state) {
      return state.count + 2;
    }
  },
  mutations: {
    incrementA(state) {
      state.count++;
    }
  },
  actions: {
    incrementAAction(context) {
      context.commit("incrementA");
    }
  }
};

let store = new Vuex.Store({
  modules: {
    a: pageA
  },
  state: {
    count: 0
  },
  actions: {
    countPlusSix(context) {
      context.commit("plusSix");
    }
  },
  mutations: {
    incrementFive(state) {
      // console.log('初始state', JSON.stringify(state));
      state.count = state.count + 5;
    },
    plusSix(state) {
      state.count = state.count + 6;
    }
  },
  getters: {
    getStatePlusOne(state) {
      return state.count + 1;
    }
  }
});

Vue.config.productionTip = false;

const vm = new Vue({
  store,
  render: h => h(App)
}).$mount("#app");

console.log(vm.$store);
