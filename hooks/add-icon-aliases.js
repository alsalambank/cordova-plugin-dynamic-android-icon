#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const aliases = ['classic', 'retro', 'private'];
const iconPrefix = '@mipmap/ic_launcher_';
const mainActivity = '.MainActivity'; // Change if your activity is different

const manifestPath = path.join(
  'platforms', 'android', 'app', 'src', 'main', 'AndroidManifest.xml'
);

// Don't proceed if the manifest doesn't exist yet
if (!fs.existsSync(manifestPath)) {
  console.log('[DynamicIcon] AndroidManifest.xml not found yet. Skipping alias injection.');
  return;
}

let manifest = fs.readFileSync(manifestPath, 'utf8');

// Prevent duplicate injection
if (manifest.includes('android:name=".' + aliases[0] + '"')) {
  console.log('[DynamicIcon] Alias entries already exist. Skipping injection.');
  return;
}

// Build alias block
let aliasXml = '';
aliases.forEach(alias => {
  aliasXml += `
    <activity-alias
        android:name=".${alias}"
        android:enabled="false"
        android:exported="true"
        android:icon="${iconPrefix}${alias}"
        android:targetActivity="${mainActivity}">
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
    </activity-alias>\n`;
});

// Inject aliases before </application>
manifest = manifest.replace('</application>', `${aliasXml}</application>`);

fs.writeFileSync(manifestPath, manifest, 'utf8');
console.log('[DynamicIcon] Injected activity-alias entries into AndroidManifest.xml');
