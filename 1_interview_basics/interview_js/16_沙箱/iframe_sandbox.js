// 注：这个没太弄明白 

// iframe 标签可以创造一个独立的浏览器原生级别的运行环境，这个环境由浏览器实现了与主环境的隔离
// 利用iframe来实现一个沙箱是目前最方便、简单、安全的方法
// 可以把iframe.contentWindow作为当前沙箱执行的全局对象

// 沙箱全局代理对象类
class SandboxGlobalProxy {
    constructor(sharedState) {
      // 创建一个 iframe 标签，取出其中的原生浏览器全局对象作为沙箱的全局对象
      const iframe = document.createElement("iframe", { url: "about:blank" });
      iframe.style.display = "none";
      document.body.appendChild(iframe);
      const sandboxGlobal = iframe.contentWindow; // 沙箱运行时的全局对象
  
      return new Proxy(sandboxGlobal, {
        has: (target, prop) => {
          // has 可以拦截 with 代码块中任意属性的访问
          if (sharedState.includes(prop)) {
            // 如果属性存在于共享的全局状态中，则让其沿着原型链在外层查找
            return false;
          }
          if (!target.hasOwnProperty(prop)) {
            throw new Error(`Not find - ${prop}!`);
          }
          return true;
        }
      });
    }
}

// 构造一个 with 来包裹需要执行的代码，返回 with 代码块的一个函数实例
function withedYourCode(code) {
    code = "with(sandbox) {" + code + "}";
    return new Function("sandbox", code);
  }
  function maybeAvailableSandbox(code, ctx) {
    withedYourCode(code).call(ctx, ctx);
  }

  const code_1 = `
    console.log(history == window.history) // false
    window.abc = 'sandbox'
    Object.prototype.toString = () => {
        console.log('Traped!')
    }
    console.log(window.abc) // sandbox
  `;

const sharedGlobal_1 = ["history"]; // 希望与外部执行环境共享的全局对象

const globalProxy_1 = new SandboxGlobalProxy(sharedGlobal_1);

maybeAvailableSandbox(code_1, globalProxy_1);

// 对外层的window对象没有影响
console.log(window.abc); // undefined
Object.prototype.toString(); // 并没有打印 Traped

