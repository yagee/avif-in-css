const DEFAULT_OPTIONS = {
  modules: false,
  noAvifClass: 'no-avif',
  avifClass: 'avif',
  addNoJs: true,
  noJsClass: 'no-js',
  rename: oldName => {
    return oldName.replace(/\.(jpe?g|png)/gi, '.avif')
  }
}

module.exports = (opts = {}) => {
  let { modules, noAvifClass, avifClass, addNoJs, noJsClass, rename } = {
    ...DEFAULT_OPTIONS,
    ...opts
  }

  function removeHtmlPrefix(className) {
    return className.replace(/html ?\./, '')
  }

  function addClass(selector, className) {
    let generatedNoJsClass
    let initialClassName = className
    if (className.includes('html')) {
      className = removeHtmlPrefix(className)
    }
    if (modules) {
      className = `:global(.${className})`
      generatedNoJsClass = `:global(.${noJsClass})`
    } else {
      className = `.${className}`
      generatedNoJsClass = `.${noJsClass}`
    }
    if (selector.includes('html')) {
      selector = selector.replace(/html[^ ]*/, `$& body${className}`)
    } else {
      selector = `body${className} ` + selector
    }
    if (addNoJs && initialClassName === noAvifClass) {
      selector +=
        ', ' +
        selector.split(`body${className}`).join(`body${generatedNoJsClass}`)
    }
    return selector
  }
  return {
    postcssPlugin: 'avif-in-css/plugin',
    Declaration(decl) {
      if (/\.(jpe?g|png)(?!(\.avif|.*[&?]format=avif))/i.test(decl.value)) {
        let rule = decl.parent
        if (rule.selector.includes(`.${removeHtmlPrefix(noAvifClass)}`)) return
        let avif = rule.cloneAfter()
        avif.each(i => {
          if (i.prop !== decl.prop && i.value !== decl.value) i.remove()
        })
        avif.selectors = avif.selectors.map(i => addClass(i, avifClass))
        avif.each(i => {
          if (
            rename &&
            Object.prototype.toString.call(rename) === '[object Function]'
          ) {
            i.value = rename(i.value)
          }
        })
        let noAvif = rule.cloneAfter()
        noAvif.each(i => {
          if (i.prop !== decl.prop && i.value !== decl.value) i.remove()
        })
        noAvif.selectors = noAvif.selectors.map(i => addClass(i, noAvifClass))
        decl.remove()
        if (rule.nodes.length === 0) rule.remove()
      }
    }
  }
}
module.exports.postcss = true
