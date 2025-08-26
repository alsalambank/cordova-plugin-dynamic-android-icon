const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const builder = new xml2js.Builder({ headless: false, pretty: true });

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
  // Step 4: Copy icons to platform folders
  // -------------------------------  
  const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
  let platform = result.widget.platform?.find(p => p.$.name === 'android');
  if (!platform) {
      // Create platform node if missing
      platform = { $: { name: 'android' }, icon: [] };
      result.widget.platform = result.widget.platform || [];
      result.widget.platform.push(platform);
  }

  // Remove existing adaptive-icon entries
  platform.icon = [];
    
  densities.forEach(density => {
    const targetDir = path.join(platformResPath, `mipmap-${density}`);
    const sourceDir = path.join(pluginRes, `mipmap-${density}`);
    if (!fs.existsSync(sourceDir)) return;
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    // Add entry to config.xml
    platform.icon.push({
        $: { 
          src:        `${sourceDir.replace(`${projectRoot}/`, "")}/ic_launcher_classic.png`, 
          foreground: `${pluginRes.replace(`${projectRoot}/`, "")}/drawable/ic_launcher_foreground_classic.xml`, 
          background: "@color/ic_launcher_background_color_classic", 
          monochrome: `${pluginRes.replace(`${projectRoot}/`, "")}/drawable/ic_launcher_foreground_classic.xml`, 
          density 
        }
    });

    fs.readdirSync(sourceDir).forEach(file => {
      fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
      console.log(`✔ Copied ${file} to ${targetDir}`);
    });
  });

  // -------------------------------
  // Step 5: Update config.xml with adaptive icons
  // -------------------------------
  const finalXml = builder.buildObject(result);
  fs.writeFileSync(configPath, finalXml, "utf-8");
  console.log('Adaptive icons updated in config.xml!');
};
