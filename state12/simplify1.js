/*
 * @Author: mashitu
 * @Date: 2022-12-06 18:02:40
 * @LastEditTime: 2022-12-06 18:20:13
 * @LastEditors: mashitu
 * @Description: 这里只写组件关键代码
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
    // 文本节点  将文本信息当做一个节点
  } else if (type === Text) {
  } else if (type === Comment) {
  } else if (type === Fragment) {
    // 处理 Fragment 类型的 vnode
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
  /* 本章节相关代码结束 */
}

// 最简单的组件示例
const MyComponent = {
  // 组件名称，可选
  name: "MyComponent",
  // 组件的渲染函数，其返回值必须为虚拟 DOM
  render() {
    // 返回虚拟 DOM
    return {
      type: "div",
      children: `我是文本内容`,
    };
  },
};

function mountComponent(vnode, container, anchor) {
  // 通过 vnode 获取组件的选项对象，即 vnode.type
  const componentOptions = vnode.type;
  // 获取组件的渲染函数 render
  const { render } = componentOptions;
  // 执行渲染函数，获取组件要渲染的内容，即 render 函数返回的虚拟 DOM
  const subTree = render();
  // 最后调用 patch 函数来挂载组件所描述的内容，即 subTree
  patch(null, subTree, container, anchor);
}
