// 用来存储所有对象的响应式
const bucket = new WeakMap();
// 唯一的副作用函数引用
let activeEffect = null;

// 注册副作用函数
function effect(fn) {
  activeEffect = fn;
  fn()
}
// 跟踪函数
function track(target, key) {
  // 当前对象相关的 key 与 副作用函数 映射集合Map
  let depsMap = bucket.get(target)
  if (!depsMap) {
    bucket.set(target, depsMap = new Map())
  }
  // 副作用函数集合set
  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, deps = new Set())
  }
  deps.add(activeEffect)
}
// 触发函数
function trigger(target, key) {
  let depsMap = bucket.get(target)
  if (!depsMap) {
    return
  }
  // 副作用函数集合set
  let effects = depsMap.get(key)
  if (effect) {
    effects.forEach(effect => {
      effect()
    });
  }
}


// 测试代码

// 需要跟踪的对象
const origin = { a: 2 }

const newTarget = new Proxy(origin, {
  get: function (target, key) {
    track(target, key)
    return target[key]
  },
  set: function (target, key, value) {
    // 先后顺序 需要保证 确保拿到最新的value
    target[key] = value
    trigger(target, key)
  }
})
// 设置副作用对象 建立对newTarget的引用
effect(() => {
  console.log(newTarget.a);
})

setTimeout(() => {
  newTarget.a = 1
}, 3000);
