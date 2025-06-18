const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

module.exports = function (context) {
  const projectRoot = context.opts.projectRoot;
  const configPath = path.join(projectRoot, 'config.xml');
  const javaFileName = 'DynamicIcon.java';

  const tempJavaFile = path.join(projectRoot, 'platforms/android/app/src/main/java/src/temp', javaFileName);
  if (!fs.existsSync(tempJavaFile)) {
    console.warn('Temporary Java file not found:', tempJavaFile);
    return;
  }

  if (!fs.existsSync(configPath)) {
    console.warn('config.xml not found');
    return;
  }

  const xml = fs.readFileSync(configPath, 'utf-8');
  xml2js.parseString(xml, (err, result) => {
    if (err || !result.widget || !result.widget.$.id) {
      console.warn('Could not parse package from config.xml');
      return;
    }

    const packageName = result.widget.$.id;
    const javaPackagePath = packageName.replace(/\./g, '/');
    const finalJavaDir = path.join(projectRoot, 'platforms/android/app/src/main/java', javaPackagePath);

    if (!fs.existsSync(finalJavaDir)) {
      fs.mkdirSync(finalJavaDir, { recursive: true });
    }

    let javaCode = fs.readFileSync(tempJavaFile, 'utf-8');
    javaCode = javaCode.replace(/package .*;/, `package ${packageName};`);
    const finalJavaFile = path.join(finalJavaDir, javaFileName);

    fs.writeFileSync(finalJavaFile, javaCode);
    fs.unlinkSync(tempJavaFile);

    console.log(`✔ Moved and patched ${javaFileName} to ${finalJavaFile}`);
  });
};
