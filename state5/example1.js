const obj = {
  index: 1,
  get foo() {
    return this.index
  }
}
console.log(Reflect.get(obj, "foo")); // 2 
console.log(Reflect.get(obj, "foo", { index:2 })); // 2 