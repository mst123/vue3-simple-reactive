// 用来存储所有对象的响应式
const bucket = new WeakMap();
// 唯一的副作用函数引用
let activeEffect = null;

// 注册副作用函数
function effect(fn) {
  // 实际的副作用函数 包含清除依赖 赋值activeEffect 执行传入函数(重新收集依赖) 三个功能
  const effectFn = () => {
    cleanup(effectFn)
    activeEffect = effectFn;
    fn()
  }
  // NOTICE 这里只会初始执行一次
  effectFn.deps = [];
  effectFn();
}
// 清除依赖集合中的副作用函数
function cleanup(effect) {
  effect.deps.forEach(item => {
    // item 是与key值相关的副作用函数集合set
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
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  // 与key值相关的副作用函数集合set
  deps.add(activeEffect);
  // 副作用函数持有key对应的副作用集合
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

const data = { ok: true, text: "hello world" };
const obj = reactiveInit(data);

effect(() => {
  console.log(obj.ok ? obj.text : "not");
});

setTimeout(() => {
  console.log("应该打印-触发成功");
  obj.text = "触发成功"
}, 1000);

setTimeout(() => {
  console.log("应该打印-not");
  obj.ok = false
}, 2000);

setTimeout(() => {
  console.log("后边应该不会打印");
  obj.text = "有问题"
}, 3000);
