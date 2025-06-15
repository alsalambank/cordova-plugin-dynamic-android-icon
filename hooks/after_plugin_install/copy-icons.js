const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

module.exports = function (context) {
  const platformResPath = path.join(context.opts.projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'res');
  const pluginRes = path.join(context.opts.plugin.dir, 'res');

  const mipmapDirs = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];

  mipmapDirs.forEach(dir => {
    const targetDir = path.join(platformResPath, dir);
    const sourceDir = path.join(pluginRes, dir);
    if (!fs.existsSync(sourceDir)) return;
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    fs.readdirSync(sourceDir).forEach(file => {
      fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
      console.log(`✔ Copied ${file} to ${targetDir}`);
    });
  });

  const configPath = path.join(context.opts.projectRoot, 'config.xml');
  const javaFileRelPath = 'com/example/dynamicicon/DynamicIcon.java';
  const javaFilePath = path.join(context.opts.projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'java', javaFileRelPath);

  if (!fs.existsSync(configPath) || !fs.existsSync(javaFilePath)) {
    console.warn('Missing config.xml or Java file for package substitution.');
    return;
  }

  const xml = fs.readFileSync(configPath, 'utf-8');
  xml2js.parseString(xml, (err, result) => {
    if (err || !result.widget || !result.widget.$.id) {
      console.warn('Could not determine package name from config.xml.');
      return;
    }

    const packageName = result.widget.$.id;
    let javaCode = fs.readFileSync(javaFilePath, 'utf-8');
    javaCode = javaCode.replace(/__PACKAGE__/g, packageName);
    fs.writeFileSync(javaFilePath, javaCode);
    console.log(`✔ Replaced __PACKAGE__ with ${packageName} in DynamicIcon.java`);
  });
};
