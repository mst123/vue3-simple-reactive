/*
 * @Author: mashitu
 * @Date: 2022-12-06 18:02:40
 * @LastEditTime: 2022-12-06 18:29:24
 * @LastEditors: mashitu
 * @Description: 组件状态与自更新
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
  const { render, data } = componentOptions;
  const state = reactive(data());
  effect(
    () => {
      const subTree = render.call(state, state);
      patch(null, subTree, container, anchor);
    },
    {
      // 指定该副作用函数的调度器为 queueJob 即可
      scheduler: queueJob,
    }
  );
}
