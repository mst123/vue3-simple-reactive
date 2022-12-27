/*
 * @Author: mashitu
 * @Date: 2022-12-22 18:20:45
 * @LastEditTime: 2022-12-22 19:18:12
 * @LastEditors: mashitu
 * @Description: 重试机制
 */

function defineAsyncComponent(options) {
  if (typeof options === "function") {
    options = {
      loader: options,
    };
  }

  const { loader } = options;

  let InnerComp = null;

  // 记录重试次数
  let retries = 0;
  // 封装 load 函数用来加载异步组件
  function load() {
    return (
      // 省略了then代码
      loader()
        // 捕获加载器的错误
        .catch((err) => {
          // 如果用户指定了 onError 回调，则将控制权交给用户
          if (options.onError) {
            // 返回一个新的 Promise 实例
            return new Promise((resolve, reject) => {
              // 重试
              const retry = () => {
                resolve(load());
                retries++;
              };
              // 失败
              const fail = () => reject(err);
              // 作为 onError 回调函数的参数，让用户来决定下一步怎么做
              options.onError(retry, fail, retries);
            });
          } else {
            throw error;
          }
        })
    );
  }

  return {
    name: "AsyncComponentWrapper",
    setup() {
      const loaded = ref(false);
      const error = shallowRef(null);
      const loading = ref(false);

      let loadingTimer = null;
      if (options.delay) {
        loadingTimer = setTimeout(() => {
          loading.value = true;
        }, options.delay);
      } else {
        loading.value = true;
      }
      // 调用 load 函数加载组件
      load()
        .then((c) => {
          InnerComp = c;
          loaded.value = true;
        })
        .catch((err) => {
          error.value = err;
        })
        .finally(() => {
          loading.value = false;
          clearTimeout(loadingTimer);
        });

      // 省略部分代码
    },
  };
}
// 重试demo代码 方便理解
function fetch() {
  return new Promise((resolve, reject) => {
    // 请求会在 1 秒后失败
    setTimeout(() => {
      reject("err");
    }, 1000);
  });
}

// load 函数接收一个 onError 回调函数
// 通过onError函数 我们可以自己控制失败后的下一步操作
function load(onError) {
  // 请求接口，得到 Promise 实例
  const p = fetch();
  // 捕获错误
  return p.catch((err) => {
    // 当错误发生时，返回一个新的 Promise 实例，并调用 onError 回调，
    // 同时将 retry 函数作为 onError 回调的参数
    return new Promise((resolve, reject) => {
      // retry 函数，用来执行重试的函数，执行该函数会重新调用 load 函数并发送请求
      const retry = () => resolve(load(onError));
      const fail = () => reject(err);
      onError(retry, fail);
    });
  });
}
