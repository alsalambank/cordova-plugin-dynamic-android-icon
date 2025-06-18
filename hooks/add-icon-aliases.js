const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

module.exports = function (context) {
  const platformResPath = path.join(context.opts.projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'res');
  const pluginRes = path.join(context.opts.plugin.dir, 'res');

  const mipmapDirs = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];

  // Copy and rename icon files
  mipmapDirs.forEach(dir => {
    const targetDir = path.join(platformResPath, dir);
    const sourceDir = path.join(pluginRes, dir);
    if (!fs.existsSync(sourceDir)) return;
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    fs.readdirSync(sourceDir).forEach(file => {
      const baseName = path.parse(file).name; // e.g. classic, retro, private
      const ext = path.extname(file);         // e.g. .png
      const targetFileName = `ic_launcher_${baseName}${ext}`;
      const sourceFile = path.join(sourceDir, file);
      const destFile = path.join(targetDir, targetFileName);

      fs.copyFileSync(sourceFile, destFile);
      console.log(`✔ Copied ${file} ➝ ${targetFileName}`);
    });
  });

  // Package name replacement in Java source
  const configPath = path.join(context.opts.projectRoot, 'config.xml');
  const javaFileRelPath = 'com/example/dynamicicon/DynamicIcon.java';
  const javaFilePath = path.join(context.opts.projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'java', javaFileRelPath);

  if (!fs.existsSync(configPath) || !fs.existsSync(javaFilePath)) {
    console.warn('⚠️  Missing config.xml or Java file for package substitution.');
    return;
  }

  const xml = fs.readFileSync(configPath, 'utf-8');
  xml2js.parseString(xml, (err, result) => {
    if (err || !result.widget || !result.widget.$.id) {
      console.warn('⚠️  Could not determine package name from config.xml.');
      return;
    }

    const packageName = result.widget.$.id;
    let javaCode = fs.readFileSync(javaFilePath, 'utf-8');
    javaCode = javaCode.replace(/__PACKAGE__/g, packageName);
    fs.writeFileSync(javaFilePath, javaCode);
    console.log(`✔ Replaced __PACKAGE__ with '${packageName}' in DynamicIcon.java`);
  });

  // Optional validation log
  const expectedFile = path.join(platformResPath, 'mipmap-mdpi', 'ic_launcher_classic.png');
  if (fs.existsSync(expectedFile)) {
    console.log(`✅ Icon present: ${expectedFile}`);
  } else {
    console.warn(`❌ Icon missing: ${expectedFile}`);
  }
};
