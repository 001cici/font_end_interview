// 要求：希望沙箱中的代码只在手动提供的上下文对象中查找变量，如果上下文对象中不存在该变量则提示对应的错误
// 思路：Proxy中的get和set方法，只能拦截已存在于代理对象中的属性，对于代理对象中不存在的属性这两个钩子是无感知的。
//      因此这里我们使用 Proxy.has() 来拦截 with 代码块中的任意变量的访问，
//      并设置一个白名单，在白名单内的变量可以正常走作用域链的访问方式，不在白名单内的变量，会继续判断是否存在沙箱自行维护的上下文对象中，
//      存在则正常访问，不存在则直接报错
// 注：这里使用new Function替代eval

var foo = "foo1";

const ctx = {
    func: variable => {
        console.log(variable);
    }
};

function withedYourCode(code) {
    code = "with(shadow) {" + code + "}";
    return new Function("shadow", code)
}

const access_white_list = ["func"];

const code = `func(foo)`;

const ctxProxy = new Proxy(ctx, {
    has: (target, prop) => {
        if (access_white_list.includes(prop)) {
            return target.hasOwnProperty(prop)
        }

        if (!target.hasOwnProperty(prop)) {
            throw new Error(`Not found - ${prop}!`)
        }
        return true;
    }
})

function littlePoorSandbox(code, ctx) {
    withedYourCode(code).call(ctx, ctx)
}
littlePoorSandbox(code, ctxProxy)
// 执行func(foo)，报错： Uncaught Error: Not found - foo!