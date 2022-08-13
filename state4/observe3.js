// 用来存储所有对象的响应式
const bucket = new WeakMap();
// 唯一的副作用函数引用
let activeEffect = null;
// 增加一个副作用函数栈
const effectStack = [];

// 注册副作用函数
function effect(fn) {
  // 实际的副作用函数 包含清除依赖 赋值activeEffect 执行传入函数 三个功能
  const effectFn = () => {
    cleanup(effectFn)
    activeEffect = effectFn
    // 入栈
    effectStack.push(effectFn)
    fn()
    // 执行完当前函数 需要删除
    effectStack.pop()
    // 恢复到上一个effectFn 关键步骤
    activeEffect = effectStack[effectStack.length - 1]
  }
  // 初始执行一次
  effectFn.deps = [];
  effectFn();
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
      effect();
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

// 测试代码

const data = { foo: true, bar: true };
const obj = reactiveInit(data);

let temp1, temp2;
effect(function effectFn1() {
  console.log("effectFn1执行");
  effect(function effectFn2() {
    console.log("effectFn2执行");
    temp2 = obj.bar
  })

  temp1 = obj.foo
})

setTimeout(() => {
  obj.foo = false
}, 2000);
