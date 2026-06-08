/**
 * PostCSS plugin: strip WXSS-incompatible CSS before it reaches the output.
 * Runs during webpack compilation, not as a post-build patch.
 */
const stripWxssPlugin = () => ({
  postcssPlugin: "strip-wxss",
  Once(root, { result }) {
    root.walkRules((rule) => {
      // Remove entire rules that contain CSS escapes (backslash in selector)
      if (rule.selector.includes("\\")) {
        rule.remove();
      }
    });
    root.walkDecls((decl) => {
      // Fix !important spacing (WXSS requires "! important" not "!important")
      if (decl.important) {
        decl.important = false;
        // Re-add with proper format via raw value
        decl.value = decl.value + " ! important";
      }
    });
  },
});

stripWxssPlugin.postcss = true;
module.exports = stripWxssPlugin;
