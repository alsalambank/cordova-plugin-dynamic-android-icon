#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

module.exports = function (context) {
  const cordovaUtil = context.requireCordovaModule("cordova-lib/src/cordova/util");
  const projectRoot = cordovaUtil.isCordova();
  const configXml = path.join(projectRoot, 'config.xml');
  const javaFile = path.join(projectRoot, 'platforms/android/app/src/main/java/com/example/dynamicicon/DynamicIcon.java');

  fs.readFile(configXml, 'utf8', (err, data) => {
    if (err) throw err;

    xml2js.parseString(data, (err, result) => {
      if (err) throw err;

      const packageName = result.widget.$.id;
      if (!packageName) {
        console.error("No package ID found in config.xml");
        return;
      }

      fs.readFile(javaFile, 'utf8', (err, javaData) => {
        if (err) throw err;

        const replaced = javaData.replace(/__PACKAGE__/g, packageName);
        fs.writeFile(javaFile, replaced, 'utf8', (err) => {
          if (err) throw err;
          console.log("✔ Replaced __PACKAGE__ with", packageName);
        });
      });
    });
  });
};
