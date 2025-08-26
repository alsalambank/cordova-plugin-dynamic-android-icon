#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");

module.exports = function(context) {
    const projectRoot = context.opts.projectRoot;
    const manifestPath = path.join(
            projectRoot,
            "platforms/android/app/src/main/AndroidManifest.xml"
        );
    const androidConfigPath = path.join(
        projectRoot,
        "platforms",
        "android",
        "app",
        "src",
        "main",
        "res",
        "xml",
        "config.xml"
    );

    if (!fs.existsSync(androidConfigPath)) {
        console.warn("⚠ config.xml not found (maybe run `cordova prepare android` first).");
        return;
    }

    if (!fs.existsSync(manifestPath)) {
        console.warn("⚠ AndroidManifest.xml not found (maybe run `cordova prepare android` first).");
        return;
    }

    const xml = fs.readFileSync(androidConfigPath, "utf-8");
    const parser = new xml2js.Parser();
    const builder = new xml2js.Builder({ headless: true, xmldec: { version: "1.0", encoding: "utf-8" } });

    parser.parseString(xml, (err, obj) => {
        if (err) throw err;

        // Read the package from root config.xml
        const packageName = obj.widget.$.id;

        // Traverse features
        const features = obj.widget.feature || [];
        features.forEach(feature => {
            if (feature.$.name === "DynamicIcon") {
                feature.param.forEach(param => {
                    if (param.$.name === "android-package") {
                        param.$.value = `${packageName}.DynamicIcon`;
                    }
                });
            }
        });

        obj.widget.feature = features;
        const updatedXml = builder.buildObject(obj);
        fs.writeFileSync(androidConfigPath, updatedXml, "utf-8");
        console.log(`✔ Updated android-package for DynamicIcon to ${packageName}.DynamicIcon`);
    });
};
