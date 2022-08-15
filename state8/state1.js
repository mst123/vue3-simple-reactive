const { effect, ref } = VueReactivity;
// renderer 渲染器
function createRenderer(options) {
  // 为了设计多平台通用的渲染器 需要传入
  const {
    createElement,
    insert,
    setElementText
  } = options
  // 挂载或更新
  function patch(n1, n2, container) {
    // 旧vnode不存在，挂载
    if (!n1) {
      mountElement(n2, container)
    } else {
      // n1 存在 打补丁
      
    }
  }
  // 根据vnode创建真实dom 挂载到container(dom)上
  function mountElement(vnode, container) {
    const el = createElement(vnode.type)
    // 简单元素仅有文本
    if (typeof vnode.children === "string") {
      setElementText(el,  vnode.children)
    } else if (Array.isArray(vnode.children)) {
      vnode.children.forEach(child => {
        // 处理子vnode
        patch(null, child, el)
      });
    }
    insert(el, container)
  }
  // 对外提供 render 方法
  function render(vnode, container) {
    if (vnode) {
      // 新 vnode 存在 进行挂载或更新操作
      patch(container._vnode, vnode, container)
    } else {
      // 卸载阶段
      if (container._vnode) {
        container.innerHTML = ""
      }
    }
    // 将新vnode赋值，作为下一次的旧vnode
    container._vnode = vnode
  }  
  return {
    render
  }
}

const renderer = createRenderer({
  // 创建元素
  createElement(tag) {
    return document.createElement(tag)
  },
  // 在指定的parent添加指定元素
  insert(el, parent, anchor = null) {
    // anchor 锚
    parent.insertBefore(el, anchor)
  },
  // 设置文本标签
  setElementText(el, text) {
    el.textContent = text
  }
})