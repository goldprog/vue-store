let Vue;
export class Store {
  constructor(options = {}) {
    this.options = options;
    const state = options.state;
    this.getters = {};
    this._mutations = {};
    this._actions = {};
    this._modules = new CollectionModule(options);
    const { commit, dispatch } = this;
    this.commit = type => {
      return commit.call(this, type);
    };
    this.dispatch = type => {
      return dispatch.call(this, type);
    };

    const path = [];
    installModules(this, path, state, this._modules.root);

    this._vm = new Vue({
      data: {
        state
      }
    });
  }
  get state() {
    return this._vm._data.state;
  }
  commit(type) {
    this._mutations[type].forEach(fn => fn());
  }
  dispatch(type) {
    return this._actions[type][0]();
  }
}

class CollectionModule {
  constructor(rowModules) {
    this.registerModule([], rowModules);
  }
  registerModule(path, module) {
    const newModule = {
      state: module.state,
      _children: {},
      _rawModules: module
    };
    if (path.length === 0) {
      this.root = newModule;
    } else {
      const parent = path.slice(0, -1).reduce((acc, cur) => {
        return acc._children[cur];
      }, this.root);
      parent._children[path[path.length - 1]] = newModule;
    }

    if (module.modules) {
      forEachValue(module.modules, (childModule, key) => {
        this.registerModule(path.concat(key), childModule);
      });
    }
  }
}

function getNestedState(state, path) {
  return path.length ? path.reduce((acc, cur) => acc[cur], state) : state;
}

function installModules(store, path, rootState, modules) {
  if (path.length > 0) {
    const parentRoot = getNestedState(rootState, path.slice(0, -1));
    const moduleName = path[path.length - 1];
    Vue.set(parentRoot, moduleName, modules.state);
  }
  const context = {
    commit: store.commit,
    dispatch: store.dispatch
  };
  const local = Object.defineProperties(context, {
    getters: {
      get: () => store.getters
    },
    state: {
      get: () => getNestedState(store.state, path)
    }
  });

  if (modules._rawModules.getters) {
    // 注册getters
    forEachValue(modules._rawModules.getters, (getterFn, getterName) => {
      registerGetters(store, getterName, getterFn, local);
    });
  }
  if (modules._rawModules.mutations) {
    // 注册mutations
    forEachValue(modules._rawModules.mutations, (mutationFn, mutationName) => {
      registerMutations(store, mutationName, mutationFn, local);
    });
  }
  if (modules._rawModules.actions) {
    // 注册actions
    forEachValue(modules._rawModules.actions, (actionFn, actionName) => {
      registerActions(store, actionName, actionFn, local);
    });
  }

  forEachValue(modules._children, (child, key) => {
    installModules(store, path.concat(key), rootState, child);
  });
}

function registerGetters(store, getterName, getterFn, local) {
  Object.defineProperty(store.getters, getterName, {
    get: () => getterFn(local.state, local.getters, store.state)
  });
}

function registerMutations(store, mutationName, mutationFn, local) {
  let entry =
    store._mutations[mutationName] || (store._mutations[mutationName] = []);
  entry.push(() => {
    return mutationFn.call(store, local.state);
  });
}

function registerActions(store, actionName, actionFn, local) {
  let entry = store._actions[actionName] || (store._actions[actionName] = []);
  entry.push(() => {
    return actionFn.call(store, {
      commit: local.commit,
      state: local.state
    });
  });
}

function forEachValue(obj, fn) {
  Object.keys(obj).forEach(key => fn(obj[key], key));
}

export const install = function(_Vue) {
  Vue = _Vue;
  Vue.mixin({
    beforeCreate: function vuexInit() {
      const options = this.$options;
      if (options.store) {
        this.$store = options.store;
      } else if (options.parent && options.parent.$store) {
        this.$store = options.parent.$store;
      }
    }
  });
};
