const root = document.documentElement;

let style = getComputedStyle(root);
let uiH = style.getPropertyValue('--ui-el-h').slice(0, -2);