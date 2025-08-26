const fs = require('fs');
const path = require('path');

module.exports = async function (context) {
  const projectRoot = context.opts.projectRoot;
  const pluginRoot  = context.opts.plugin.dir;
  const platformResPath = path.join(projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'res');
  const pluginRes = path.join(pluginRoot, 'res');

  const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];

  densities.forEach(density => {
    const targetDir = path.join(platformResPath, `mipmap-${density}-v26`);
    const sourceDir = path.join(pluginRes, `mipmap-anydpi-v26`);
    if (!fs.existsSync(sourceDir)) return;
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    fs.readdirSync(sourceDir).forEach(file => {
      fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
      console.log(`✔ Copied ${file} to ${targetDir}`);
    });
  });
};
