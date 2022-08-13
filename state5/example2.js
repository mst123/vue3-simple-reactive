
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
  // 和for in 相关的副作用函数
  const iterateEffects = depsMap.get(ITERATE_KEY)
  iterateEffects && iterateEffects.forEach(
    (effect) => {
      if (effect !== activeEffect) {
        effect();
      }
    }
  )
  // 副作用函数集合set
  let effects = depsMap.get(key);
  const effectsToRun = new Set(effects)
  if (effectsToRun) {
    effectsToRun.forEach((effect) => {
      if (effect !== activeEffect) {
        if (effect.options.scheduler) {
          // 用户自定义调度
          effect.options.scheduler(effect);
        } else { // 默认调用
          effect();
        }
      }
    });
  }
}
// for in
const ITERATE_KEY = Symbol();

function reactive(origin) {
  return new Proxy(origin, {
    ownKeys(target) {
      // 将副作用函数与ITERATE_KEY建立联系
      track(target, ITERATE_KEY)
      return Reflect.ownKeys(target)
    },
    get: function (target, key) {
      track(target, key);
      return Reflect.get(target, key)
    },
    set: function (target, key, value) {
      // 先后顺序 需要保证 确保拿到最新的value
      const res = Reflect.set(target, key, value)
      trigger(target, key);
      return res;
    },
  });
}
const obj = reactive({
  foo: 1
})
// 测试代码
effect(() => {
  for (const key in obj) {
    console.log(key);
  }
})

// 修改
// console.log(obj.foo);

obj.bar = 2