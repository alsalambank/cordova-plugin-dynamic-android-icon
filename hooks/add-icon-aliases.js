const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

module.exports = function (context) {
  const projectRoot = context.opts.projectRoot;
  const platformResPath = path.join(projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'res');
  const pluginRes = path.join(context.opts.plugin.dir, 'res');
  const mipmapDirs = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];

  // ✅ Step 1: Copy icons to Android res folders
  mipmapDirs.forEach(dir => {
    const sourceDir = path.join(pluginRes, dir);
    const targetDir = path.join(platformResPath, dir);

    if (!fs.existsSync(sourceDir)) return;
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    fs.readdirSync(sourceDir).forEach(file => {
      const srcFile = path.join(sourceDir, file);
      const destFile = path.join(targetDir, file);
      fs.copyFileSync(srcFile, destFile);
      console.log(`✔ Copied ${file} to ${targetDir}`);
    });
  });

  // ✅ Step 2: Replace __PACKAGE__ in DynamicIcon.java
  const configPath = path.join(projectRoot, 'config.xml');
  if (!fs.existsSync(configPath)) {
    console.warn('⚠️ config.xml not found');
    return;
  }

  const javaSrcDir = path.join(projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'java');

  const xml = fs.readFileSync(configPath, 'utf-8');
  xml2js.parseString(xml, (err, result) => {
    if (err || !result.widget || !result.widget.$.id) {
      console.warn('⚠️ Could not parse package name from config.xml');
      return;
    }

    const packageName = result.widget.$.id;
    const packagePath = packageName.replace(/\./g, '/');
    const javaFilePath = path.join(javaSrcDir, packagePath, 'DynamicIcon.java');

    if (!fs.existsSync(javaFilePath)) {
      console.warn('⚠️ DynamicIcon.java not found at expected path:', javaFilePath);
      return;
    }

    let javaCode = fs.readFileSync(javaFilePath, 'utf-8');
    if (javaCode.includes('__PACKAGE__')) {
      javaCode = javaCode.replace(/__PACKAGE__/g, packageName);
      fs.writeFileSync(javaFilePath, javaCode);
      console.log(`✔ Replaced __PACKAGE__ with ${packageName} in DynamicIcon.java`);
    }
  });
};
