/**
 * Very simple rule: disallow raw string literals in JSX text/attributes.
 * Allow inside t('...') or <T k="..."/>.
 */
export default {
  rules: {
    'no-hardcoded-ui': {
      meta: { type: 'problem' },
      create(context) {
        const allowComponents = new Set(['T'])
        function isAllowedCall(node) {
          return node.callee &&
                 node.callee.name === 't' &&
                 node.arguments &&
                 node.arguments[0] &&
                 (node.arguments[0].type === 'Literal' || node.arguments[0].type === 'TemplateLiteral')
        }
        return {
          JSXText(node) {
            const text = node.value.replace(/\s+/g, ' ').trim()
            if (!text) return
            // Allow purely numeric/symbolic texts
            if (/^[\d\W]+$/.test(text)) return
            context.report({ node, message: 'Hardcoded UI string: use t() or <T k="…"/>' })
          },
          Literal(node) {
            // flag string props like placeholder="Text" inside JSX
            if (typeof node.value !== 'string') return
            const p = node.parent
            if (p && p.type === 'JSXAttribute') {
              // allow <T k="..."/>
              if (p.parent && allowComponents.has(p.parent.name && p.parent.name.name)) return
              context.report({ node, message: 'Hardcoded UI string in JSX prop: use t()' })
            }
            // allow t('...')
            if (p && p.type === 'CallExpression' && isAllowedCall(p)) return
          }
        }
      }
    }
  }
}
