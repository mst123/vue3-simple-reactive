function mountComponent(vnode, container, anchor) {
  // 检查是否是函数式组件
  const isFunctional = typeof vnode.type === "function";

  let componentOptions = vnode.type;
  if (isFunctional) {
    // 如果是函数式组件，则将 vnode.type 作为渲染函数，将 vnode.type.props 作为 props 选项定义即可
    componentOptions = {
      render: vnode.type,
      props: vnode.type.props,
    };
  }
  // 普通组件
  /*
   * 
  const componentOptions = vnode.type;
  // 从组件选项对象中取出 props 定义，即 propsOption
  const { render, data, props: propsOption } = componentOptions; 
  */ 
}
