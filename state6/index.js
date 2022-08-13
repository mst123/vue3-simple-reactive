// 提供原始值的包装函数
function ref(val) {
  const wrapper = {
    value: val
  }
  // 不可枚举 不可编辑 不可配置
  // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
  // 用来判断是否是ref的
  Object.defineProperty(wrapper, "__v_isRef", {
    value: true
  })
  return reactive(wrapper)
}
// 响应式丢失示例
/* export default {
  setup() {
    const obj = reactive({
      foo: 1,
      bar: 2 
    })
    return {
      ...obj
    }
  }
} */
function toRef(obj, key) {
  const wrapper = {
    get value() {
      return obj[key]
    },
    set(value) {
      obj[key] = value
    }
  }
  Object.defineProperty(wrapper, "__v_isRef", {
    value: true
  })
  return wrapper
}
// ref 方案
/* export default {
  setup() {
    const obj = reactive({
      foo: 1,
      bar: 2 
    })
    return {
      foo: toRef(obj, foo),
      bar: toRef(obj, bar)
    }
  }
} */
// toRefs 方案
function toRefS(obj) {
  const ret = {}
  for (const key in obj) {
    ret[key] = toRef(obj, key)
  }
  return ret
}
export default {
  setup() {
    const obj = reactive({
      foo: 1,
      bar: 2 
    })
    return {
      ...toRefS(obj)
    }
  }
}

// 自动解包函数 vue3 内部使用
function proxyRefs(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver)
      return value.__v_isRef ? value.value : value
    },
    set(target, key, newValue, receiver) {
      const value = target[key]
      if (value.__v_isRef) {
        value.value = newValue
        return true
      }
      return Reflect.set(target, key, newValue, receiver)
    }
  })
}

// reactive 自动解包示例
const count = ref(0)
const obj = reactive({ count })

obj.count // 0