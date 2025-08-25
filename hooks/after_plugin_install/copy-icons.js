const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

module.exports = async function (context) {
  const projectRoot = context.opts.projectRoot;
  const pluginRoot  = context.opts.plugin.dir;
  const platformResPath = path.join(projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'res');
  const pluginRes = path.join(pluginRoot, 'res');

  // -------------------------------
  // Step 1: Read package name from config.xml
  // -------------------------------
  const configPath = path.join(projectRoot, "config.xml");
  const configXml = fs.readFileSync(configPath, "utf-8");
  const result = await xml2js.parseStringPromise(configXml);
  const packageId = result.widget.$.id;
  const packagePath = packageId.replace(/\./g, "/");

  // -------------------------------
  // Step 2: Copy Java file & update package declaration
  // -------------------------------
  const srcFile = path.join(pluginRoot, "src/android/DynamicIcon.java");
  const destDir = path.join(projectRoot, "platforms/android/app/src/main/java", packagePath);

  // Ensure folder exists
  if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
  }

  // Destination file path
  const destFile = path.join(destDir, "DynamicIcon.java");

  // Read the Java file
  let javaContent = fs.readFileSync(srcFile, "utf-8");

  // Replace the package declaration (assumes first line is `package ...;`)
  javaContent = javaContent.replace(/^package\s+.*?;/m, `package ${packageId};`);

  // Write the updated Java file
  fs.writeFileSync(destFile, javaContent, "utf-8");

  console.log(`✔ Copied DynamicIcon.java to ${destDir} with updated package`);

  // -------------------------------
  // Step 3: Add <feature> to config.xml if not exists
  // -------------------------------
  if (!result.widget.feature) result.widget.feature = [];

  // Check if feature already exists
  const featureExists = result.widget.feature.some(f => f.$.name === "DynamicIcon");
  if (!featureExists) {
      result.widget.feature.push({
          $: { name: "DynamicIcon" },
          param: [
              { $: { name: "android-package", value: `${packageId}.DynamicIcon` } },
              { $: { name: "onload", value: "true" } }
          ]
      });

      const updatedXml = builder.buildObject(result);
      fs.writeFileSync(configPath, updatedXml, "utf-8");
      console.log(`✔ Added <feature name="DynamicIcon"> to config.xml`);
  } else {
      console.log(`⚠️ Feature "DynamicIcon" already exists in config.xml`);
  }

  // -------------------------------
  // Step 4: Copy icons to platform folders
  // -------------------------------  
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
};
