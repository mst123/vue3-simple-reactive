const { effect, ref } = VueReactivity;
// 文本节点
const Text = Symbol();
// 注释节点
const Comment = Symbol();
// 代码片段 Fragment
const Fragment = Symbol();
// renderer 渲染器
function createRenderer(options) {
  // 为了设计多平台通用的渲染器 需要传入
  const {
    createElement,
    insert,
    createText,
    setText,
    setElementText,
    patchProps,
  } = options;
  /**
   * @description: 根据新旧虚拟dom进行挂载或者更新
   * @param {*} n1 oldVnode
   * @param {*} n2 newVnode
   * @param {*} container 容器
   * @return {*}
   */
  function patch(n1, n2, container) {
    // 第一次渲染时旧节点肯定是空的
    // 新旧vnode type不同 不能复用 直接卸载旧的
    if (n1 && n1.type !== n2.type) {
      unmount(n1);
      n1 = null;
    }
    // NOTICE 到这一步旧节点要么是空的 要么是和新节点type相同
    const { type } = n2;
    // 普通dom元素 非组件
    if (typeof type === "string") {
      // 旧vnode不存在，挂载
      if (!n1) {
        mountElement(n2, container);
      } else if (n1) {
        // 新节点 旧节点 均存在
        patchElement(n1, n2);
      }
      // 文本节点  将文本信息当做一个节点
    } else if (type === Text) {
      if (!n1) {
        const el = (n2.el = createText(n2.children));
        insert(el, container);
      } else {
        const el = (n2.el = n1.el);
        // 新旧同样是文本节点 注意patch上方处理
        if (n1.children !== n2.children) {
          // nodeValue https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nodeValue
          setText(el, n2.children);
        }
      }
      // 注释节点 将注释当成一个节点
    } else if (type === Comment) {
    } else if (type === Fragment) {
      // 处理 Fragment 类型的 vnode
      if (!n1) {
        // 如果旧 vnode 不存在，则只需要将 Fragment 的 children 逐个挂载即可
        n2.children.forEach((c) => patch(null, c, container));
      } else {
        // 如果旧 vnode 存在，则只需要更新 Fragment 的 children 即可
        // 父节点都是空的，相当于相同的节点，直接对比子节点即可
        patchChildren(n1, n2, container);
      }
    } else if (typeof type === "object") {
      // 组件类型 暂未实现
    }
  }
  // 根据vnode创建真实dom 挂载到container(dom)上
  function mountElement(vnode, container) {
    // 保存真实dom到vnode.el
    const el = (vnode.el = createElement(vnode.type));
    // 简单元素仅有文本
    if (typeof vnode.children === "string") {
      setElementText(el, vnode.children);
    } else if (Array.isArray(vnode.children)) {
      vnode.children.forEach((child) => {
        // 递归处理子vnode
        // 后期会处理组件类型 所以这里调用的是patch
        // NOTICE 此时的container已经变成新创建的el了
        patch(null, child, el);
      });
    }
    // 正确处理vnode.props
    if (vnode.props) {
      for (const key in vnode.props) {
        patchProps(el, key, null, vnode.props[key]);
      }
    }
    insert(el, container);
  }
  // 根据新旧vnode 更新element
  function patchElement(n1, n2) {
    const el = (n2.el = n1.el);
    const oldProps = n1.props;
    const newProps = n2.props;
    // 更新 当前vnode props
    for (const key in newProps) {
      // 新属性中存在 老属性不同的 更新
      if (newProps[key] !== oldProps[key]) {
        patchProps(el, key, oldProps[key], newProps[key]);
      }
    }
    for (const key in oldProps) {
      // 老属性中存在新属性没有的key 卸载
      if (!(key in newProps)) {
        patchProps(el, key, oldProps[key], null);
      }
    }
    // 更新 children
    patchChildren(n1, n2, el);
  }
  // 更新子节点 难点函数
  function patchChildren(n1, n2, container) {
    // 新节点是文本节点
    if (typeof n2.children === "string") {
      // 如果旧节点是一组子节点，则需要全部卸载
      if (Array.isArray(n1.children)) {
        // unmount 未来会涉及到触发钩子等等
        n1.children.forEach((item) => unmount(item));
      }
      // 设置文本信息
      setElementText(container, n2.children);
      // 新节点是一组子节点
    } else if (Array.isArray(n2.children)) {
      // 如果n1也是一组子节点
      if (Array.isArray(n1.children)) {
        if (typeof n2.children === "string") {
          // 省略部分代码
        } else if (Array.isArray(n2.children)) {
          const oldChildren = n1.children;
          const newChildren = n2.children;

          let lastIndex = 0;
          for (let i = 0; i < newChildren.length; i++) {
            const newVNode = newChildren[i];
            let j = 0;
            for (j; j < oldChildren.length; j++) {
              const oldVNode = oldChildren[j];
              if (newVNode.key === oldVNode.key) {
                // 相同type 相同 key 可以复用
                patch(oldVNode, newVNode, container);
                // 需要移动 小于的意思就是说当前新的虚拟dom对应的el需要向后挪
                // 1 2 3 4 --> 3 4 1 2 , 新的 1 2 满足移动的条件，真实dom需要往后移
                // 这里太绕了 可以画图理解
                if (j < lastIndex) {
                  // 代码运行到这里，说明 newVNode 对应的真实 DOM 需要移动
                  // 先获取 newVNode 的前一个 vnode，即 prevVNode
                  const prevVNode = newChildren[i - 1];
                  // 如果 prevVNode 不存在，则说明当前 newVNode 是第一个节点，它不需要移动
                  if (prevVNode) {
                    // 由于我们要将 newVNode 对应的真实 DOM 移动到 prevVNode 所对应真实 DOM 后面，
                    // 所以我们需要获取 prevVNode 所对应真实 DOM 的下一个兄弟节点，并将其作为锚点
                    const anchor = prevVNode.el.nextSibling;
                    // 调用 insert 方法将 newVNode 对应的真实 DOM 插入到锚点元素前面，
                    // 也就是 prevVNode 对应真实 DOM 的后面
                    // NOTICE 最算nextSibling为null，也可以正确插入
                    insert(newVNode.el, container, anchor);
                  }
                } else {
                  lastIndex = j;
                }
                break;
              }
            }
          }
        }
      } else {
        // 不管旧节点 是空的 还是文本节点 我们只需要清空并挂载即可
        // 清空文本信息
        setElementText(container, "");
        // 挂载新的子节点 存在递归过程
        n2.children.forEach((item) => patch(null, item, container));
      }
      // 新节点不存在子节点
    } else {
      // 如果旧节点 存在子节点 全部卸载
      if (Array.isArray(n1.children)) {
        n1.children.forEach((item) => unmount(item));
        // 如果是文本节点 则清空
      } else if (typeof n1.children === "string") {
        setElementText(container, "");
      }
      // 空节点不需要操作 其实空节点和文本节点可以用用一个操作 可能是为了性能吧
    }
  }
  // 卸载函数
  function unmount(vnode) {
    // 在卸载时，如果卸载的 vnode 类型为 Fragment，则需要卸载其 children
    if (vnode.type === Fragment) {
      vnode.children.forEach((c) => unmount(c));
      return;
    }
    const parent = vnode.el.parentNodeNode;
    if (parent) {
      parent.removeChild(vnode.el);
    }
  }
  // 对外提供 render 方法
  function render(vnode, container) {
    if (vnode) {
      // 新 vnode 存在 进行挂载或更新操作
      patch(container._vnode, vnode, container);
    } else {
      // 卸载dom
      unmount(container._vnode);
    }
    // 将新vnode赋值，作为下一次的旧vnode
    container._vnode = vnode;
  }
  return {
    render,
  };
}

const renderer = createRenderer({
  // 创建元素
  createElement(tag) {
    return document.createElement(tag);
  },
  // 设置文本标签
  setElementText(el, text) {
    el.textContent = text;
  },
  // 在指定的parent添加指定元素
  insert(el, parent, anchor = null) {
    // anchor 锚
    parent.insertBefore(el, anchor);
  },
  createText(text) {
    return document.createTextNode(text);
  },
  setText(el, text) {
    el.nodeValue = text;
  },
  // 设置 更新props
  patchProps(el, key, preValue, nextValue) {
    // 处理事件
    if (/^on/.test(key)) {
      // 借用invoker 方便处理事件的替换更新
      let invokers = el._vel || (el._vel = {});
      let invoker = invokers[key];
      const name = key.slice(2).toLowerCase();
      if (nextValue) {
        if (!invoker) {
          // 两个赋值
          invoker = el._vel[key] = (e) => {
            // 解决冒泡问题 P203
            if (e.timeStamp < invoker.attached) {
              return;
            }
            if (Array.isArray(invoker.value)) {
              invoker.value.forEach((fn) => fn(e));
            } else {
              invoker.value(e);
            }
          };
          invoker.value = nextValue;
          // 存储绑定时间 解决冒泡问题
          invoker.attached = performance.now();
          // 首次添加事件，通过invoker.value 来存储真正的事件
          el.addEventListener(name, invoker);
        } else {
          // 直接替换新的事件 避免了remove和重新add的过程
          invoker.value = nextValue;
        }
      } else if (invoker) {
        // 新的事件不存在 且老的事件存在 需要解绑
        el.removeEventListener(name, invoker);
      }
    } else if (key === "class") {
      // class 增强 代码略
    } else if (shouldSetAsProps(el, key, nextValue)) {
      // 优先使用dom properties
      const type = typeof el[key];
      // 矫正 disable之类的props
      if (type === "boolean" && nextValue === "") {
        el[key] = true;
      } else {
        el[key] = nextValue;
      }
    } else {
      // 找不到dom properties 使用setAttribute
      el.setAttribute(key, nextValue);
    }
  },
});
// 需要按照dom properties设置的属性
function shouldSetAsProps(el, key, value) {
  // 特殊处理 form 作为dom properties仅可读，必须用setAttribute处理
  if (key === "form" && el.tagName === "INPUT") {
    return false;
  }
  return key in el;
}
// 测试代码
renderer.render(
  {
    type: "div",
    props: {
      class: "test",
      onclick: [
        () => {
          console.log(1);
        },
        () => {
          console.log(2);
        },
      ],
      ondblclick() {
        console.log("双击");
      },
    },
    children: [
      {
        type: "span",
        children: [
          {
            type: Text,
            children: "我是span标签",
          },
        ],
      },
    ],
  },
  document.getElementById("app")
);

setTimeout(() => {
  // diff测试代码
  renderer.render(
    {
      type: "div",
      props: {
        class: "test",
        onclick: [
          () => {
            console.log(1);
          },
          () => {
            console.log(2);
          },
        ],
        ondblclick() {
          console.log("双击");
        },
      },
      children: [
        {
          type: "a",
          children: [
            {
              type: Text,
              children: "我是a标签",
            },
          ],
        },
      ],
    },
    document.getElementById("app")
  );
}, 2000);
