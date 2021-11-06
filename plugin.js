let postcss = require("postcss");

const DEFAULT_OPTIONS = {
  modules: false,
  noAvifClass: "no-avif",
  avifClass: "avif",
};

module.exports = postcss.plugin("avif-in-css/plugin", (opts) => {
  let { modules, noAvifClass, avifClass } = { ...DEFAULT_OPTIONS, ...opts };

  function addClass(selector, className) {
    if (modules) {
      className = `:global(.${className})`;
    } else {
      className = `.${className}`;
    }
    if (selector.includes("html")) {
      return selector.replace(/html[^ ]*/, `$& body${className}`);
    } else {
      return `body${className} ` + selector;
    }
  }

  return (root) => {
    root.walkDecls((decl) => {
      if (/\.(jpg|png)/i.test(decl.value)) {
        let rule = decl.parent;
        if (rule.selector.indexOf(`.${noAvifClass}`) !== -1) return;
        let avif = rule.cloneAfter();
        avif.each((i) => {
          if (i.prop !== decl.prop && i.value !== decl.value) i.remove();
        });
        avif.selectors = avif.selectors.map((i) => addClass(i, avifClass));
        avif.each((i) => {
          i.value = i.value.replace(/\.(jpg|png)/gi, ".avif");
        });
        let noAvif = rule.cloneAfter();
        noAvif.each((i) => {
          if (i.prop !== decl.prop && i.value !== decl.value) i.remove();
        });
        noAvif.selectors = noAvif.selectors.map((i) =>
          addClass(i, noAvifClass)
        );
        decl.remove();
        if (rule.nodes.length === 0) rule.remove();
      }
    });
  };
});
