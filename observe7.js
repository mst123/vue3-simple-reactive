// 用来存储所有对象的响应式
const bucket = new WeakMap();
// 唯一的副作用函数引用
let activeEffect = null;
// 增加一个副作用函数栈
const effectStack = [];

// 注册副作用函数
function effect(fn, options = {}) {
  // 实际的副作用函数 包含清除依赖 赋值activeEffect 执行传入函数 三个功能
  const effectFn = () => {
    cleanup(effectFn)
    activeEffect = effectFn
    // 入栈
    effectStack.push(effectFn)
    // 存储结果 computed watch使用
    const res = fn()
    // 执行完当前函数 需要删除
    effectStack.pop()
    // 恢复到上一个effectFn 关键步骤
    activeEffect = effectStack[effectStack.length - 1]
    // 返回结果 computed watch使用
    return res
  }
  // 初始执行一次
  effectFn.options = options;
  effectFn.deps = [];
  // 懒执行 新增
  if (!effectFn.options.lazy) {
    effectFn();
  }
  // 新增 computed使用
  return effectFn;
}
// 清除依赖集合中的副作用函数
function cleanup(effect) {
  effect.deps.forEach(item => {
    item.delete(effect);
  })
  // 重置deps
  effect.deps.length = 0;
}
// 跟踪函数
function track(target, key) {
  if (!activeEffect) {
    return
  }
  // 当前对象相关的 key 与 副作用函数 映射集合Map
  let depsMap = bucket.get(target);
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()));
  }
  // 副作用函数集合set
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  deps.add(activeEffect);
  // 副作用函数持有依赖集合
  activeEffect.deps.push(deps)
}
// 触发函数
function trigger(target, key) {
  let depsMap = bucket.get(target);
  if (!depsMap) {
    return;
  }
  // 副作用函数集合set
  let effects = depsMap.get(key);
  const effectsToRun = new Set(effects)
  if (effectsToRun) {
    effectsToRun.forEach((effect) => {
      if (effect !== activeEffect) {
        if (effect.options.scheduler) {
          // 用户自定义调度
          // 4 用户有自定义调度，按用户设置运行effect函数
          effect.options.scheduler(effect);
        } else { // 默认调用
          effect();
        }
      }
    });
  }
}

function reactiveInit(origin) {
  return new Proxy(origin, {
    get: function (target, key) {
      track(target, key);
      return target[key];
    },
    set: function (target, key, value) {
      // 先后顺序 需要保证 确保拿到最新的value
      target[key] = value;
      trigger(target, key);
    },
  });
}
// watch函数
/**
 * @description: watch函数
 * @param {*} getter 对象或者getter函数
 * @param {*} cb 监听函数
 * @return {*} void
 */
function watch(source, cb) {
  let getter = null;
  let oldValue, newValue;
  if (typeof source === "function") {
    getter = source
  } else { // 对象
    // 监听对象的所有key值
    getter = () => {
      // 注意这里是个函数
      traverse(source)
    }
    // getter = traverse(source) ERROR
  }
  // 1 首先注册一个effect，设置懒运行和调度函数，此时并不会运行，我们拿到了effect引用
  const effectFn = effect(getter, {
    lazy: true,
    // 需要记住 scheduler 只有在trigger函数中才会运行 也就是只有set的时候才会运行
    scheduler(fn) {
      // trigger 中会运行到这
      // 5 运行effectFn 此时obj.foo 已经是最新值了
      newValue = effectFn()
      // TODO 
      console.log(fn === effectFn);
      // newValue = fn()
      // 调用回调函数 并传入 oldValue, newValue
      cb(oldValue, newValue)
      // 细节问题，需要更新oldValue
      oldValue = newValue
    }
  })
  // 2 第一次运行effectFn，拿到oldValue 
  // 需要注意 直接运行effectFn 不会执行调度函数
  oldValue = effectFn()
}
// watch 辅助函数 递归访问到对象所有的key 用来建立连接
function traverse(value, seen = new Set()) {
  // 1 不是对象 2 排除null 3 是对象但是已经遍历过了（这个地方应该是防止循环引用对象带来的死循环）
  if (typeof value !== "object" || value === null || seen.has(value)) {
    return 
  }
  // 此时value应该是对象，此处不讨论其他数据结构 比如数组
  seen.add(value)
  for (const key of Object.keys(value)) {
    traverse(value[key], seen)
  }
}
// 测试代码

const data = { foo: 1, bar: 2 };
const obj = reactiveInit(data);

watch(
  () => obj.foo + obj.bar,
  (oldValue, newValue) => {
    console.log(oldValue, newValue);
  }
)

setTimeout(() => {
  // 3 obj.foo 自增 触发trigger
  obj.foo++
}, 200);
