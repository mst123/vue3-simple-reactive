/*
 * @Author: mashitu
 * @Date: 2022-12-06 18:02:40
 * @LastEditTime: 2022-12-22 14:08:44
 * @LastEditors: mashitu
 * @Description: 组件的实例和组件的生命周期
 */

function patch(n1, n2, container) {
  // 第一次渲染时旧节点肯定是空的
  // 新旧vnode type不同 不能复用 直接卸载旧的
  if (n1 && n1.type !== n2.type) {
    unmount(n1);
    n1 = null;
  }
  const { type } = n2;
  // 普通dom元素 非组件
  if (typeof type === "string") {
  } else if (type === Text) {
  } else if (type === Comment) {
  } else if (type === Fragment) {
    /* 本章节相关代码开始 */
  } else if (typeof type === "object") {
    // vnode.type 的值是选项对象，作为组件来处理
    if (!n1) {
      // 挂载组件
      mountComponent(n2, container, anchor);
    } else {
      // 更新组件
      patchComponent(n1, n2, anchor);
    }
  }
}

const MyComponent = {
  name: "MyComponent",
  // 用 data 函数来定义组件自身的状态
  data() {
    return {
      foo: "hello world",
    };
  },
  render() {
    return {
      type: "div",
      children: `foo 的值是: ${this.foo}`, // 在渲染函数内使用组件状态
    };
  },
};

function mountComponent(vnode, container, anchor) {
  const componentOptions = vnode.type;
  // 从组件选项对象中取得组件的生命周期函数
  const {
    render,
    data,
    beforeCreate,
    created,
    beforeMount,
    mounted,
    beforeUpdate,
    updated,
  } = componentOptions;

  // 在这里调用 beforeCreate 钩子
  beforeCreate && beforeCreate();

  const state = reactive(data());

  const instance = {
    state,
    isMounted: false,
    subTree: null,
  };
  vnode.component = instance;

  // 在这里调用 created 钩子
  created && created.call(state);

  effect(
    () => {
      // 组件的vnode
      const subTree = render.call(state, state);
      if (!instance.isMounted) {
        // 在这里调用 beforeMount 钩子
        beforeMount && beforeMount.call(state);
        patch(null, subTree, container, anchor);
        instance.isMounted = true;
        // 在这里调用 mounted 钩子
        mounted && mounted.call(state);
      } else {
        // 在这里调用 beforeUpdate 钩子
        beforeUpdate && beforeUpdate.call(state);
        patch(instance.subTree, subTree, container, anchor);
        // 在这里调用 updated 钩子
        updated && updated.call(state);
      }
      instance.subTree = subTree;
    },
    { scheduler: queueJob }
  );
}
