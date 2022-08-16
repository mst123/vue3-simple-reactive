const { effect, ref } = VueReactivity;
// renderer 渲染器
function createRenderer(options) {
  // 为了设计多平台通用的渲染器 需要传入
  const {
    createElement,
    insert,
    setElementText,
    patchProps
  } = options
  /**
   * @description: 挂载或者更新
   * @param {*} n1 oldVnode
   * @param {*} n2 newVnode
   * @param {*} container 容器
   * @return {*}
   */  
  function patch(n1, n2, container) {
    // 新旧vnode type不同 不能复用 直接卸载旧的
    if (n1 && n1.type !== n2.type) {
      unmount(n1)
      n1 = null
    }
    const { type } = n2
    if (typeof type === "string") {
      // 旧vnode不存在，挂载
      if (!n1) {
        mountElement(n2, container)
      } else if (n1) {
        // 暂未实现
        patchElement(n1, n2)
      }
    } else if (typeof type === "object") {
      // 组件类型 暂未实现
    }
  }
  // 根据vnode创建真实dom 挂载到container(dom)上
  function mountElement(vnode, container) {
    // 保存真实dom到vnode.el
    const el = vnode.el = createElement(vnode.type)
    // 简单元素仅有文本
    if (typeof vnode.children === "string") {
      setElementText(el,  vnode.children)
    } else if (Array.isArray(vnode.children)) {
      vnode.children.forEach(child => {
        // 处理子vnode
        patch(null, child, el)
      });
    }
    // 正确处理vnode.props
    if (vnode.props) {
      for (const key in vnode.props) {
        patchProps(el, key, null, vnode.props[key])
      }
    }
    insert(el, container)
  }

  // 卸载函数
  function unmount(vnode) {
    const parent = vnode.el.parent;
    if (parent) {
      parent.removeChild(el)
    }
  }
  // 对外提供 render 方法
  function render(vnode, container) {
    if (vnode) {
      // 新 vnode 存在 进行挂载或更新操作
      patch(container._vnode, vnode, container)
    } else {
      // 卸载dom
      unmount(container._vnode)
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
  },
  // 设置 更新props
  patchProps(el, key, preValue, nextValue) {
    // 处理事件
    if (/^on/.test(key)) {
      // 借用invoker 方便处理事件的替换更新 
      let invokers = el._vel || (el._vel = {})
      let invoker = invokers[key]
      const name = key.slice(2).toLowerCase()
      if (nextValue) {
        if (!invoker) {
          // 两个赋值
          invoker = el._vel[key] = (e) => {
            if (Array.isArray(invoker.value)) {
              invoker.value.forEach(fn => fn(e))
            } else {
              invoker.value(e)
            }
          }
          invoker.value = nextValue
          // 首次添加事件，通过invoker.value 来存储真正的事件
          el.addEventListener(name, invoker)
        } else {
          // 直接替换新的事件 避免了remove和重新add的过程
          invoker.value = nextValue
        }
      } else if (invoker) {
        // 新的事件不存在 且老的事件存在 需要解绑
        el.removeEventListener(name, invoker)
      }
    } else if (key === "class") {
      // class 增强 代码略
      
    }else if (shouldSetAsProps(el, key, nextValue)) {
      // 优先使用dom properties
      const type = typeof el[key]
      // 矫正 disable之类的props
      if (type === "boolean" && nextValue === "") {
        el[key] = true
      } else {
        el[key] = nextValue
      }
    } else {
      // 找不到dom properties 使用setAttribute
      el.setAttribute(key, nextValue)
    }
  }
})
// 需要按照dom properties设置的属性
function shouldSetAsProps(el, key, value) {
  // 特殊处理 form 作为dom properties仅可读，必须用setAttribute处理
  if (key === "form" && el.tagName === "INPUT") {
    return false
  }
  return key in el
}
// 测试代码
renderer.render({
  type: "div",
  props: {
    class: "test",
    onclick: [
      () => { console.log(1); },
      () => { console.log(2); }
    ],
    ondblclick() {
      console.log("双击");
    }
  },
  children: [
    {
      type: "span",
      children: "我是span"
    }
  ]
}, document.getElementById("app"))
