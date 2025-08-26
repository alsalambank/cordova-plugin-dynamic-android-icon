#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");

module.exports = function (context) {
    const manifestPath = path.join(
        context.opts.projectRoot,
        "platforms/android/app/src/main/AndroidManifest.xml"
    );

    if (!fs.existsSync(manifestPath)) {
        console.warn("⚠ AndroidManifest.xml not found (maybe run `cordova prepare android` first).");
        return;
    }

    const xml = fs.readFileSync(manifestPath, "utf-8");
    const parser = new xml2js.Parser();
    const builder = new xml2js.Builder({ headless: true, xmldec: { version: "1.0", encoding: "utf-8" } });

    parser.parseString(xml, (err, manifestObj) => {
        if (err) throw err;

        const app = manifestObj.manifest.application?.[0];
        if (!app || !app.activity) {
            console.log("ℹ No activities found in manifest.");
            return;
        }

        app.activity.forEach((activity) => {
            const activityName = activity.$["android:name"];
            if (!activityName) return;

            // Match MainActivity (short name or fully qualified)
            if (activityName.endsWith(".MainActivity") || activityName === "MainActivity") {
                if (activity["intent-filter"]) {
                    // Keep only intent-filters that are NOT MAIN+LAUNCHER
                    activity["intent-filter"] = activity["intent-filter"].filter((filter) => {
                        const actions = (filter.action || []).map(a => a.$["android:name"]);
                        const categories = (filter.category || []).map(c => c.$["android:name"]);

                        const isMain = actions.includes("android.intent.action.MAIN");
                        const isLauncher = categories.includes("android.intent.category.LAUNCHER");

                        // Remove this filter if it has both MAIN and LAUNCHER
                        return !(isMain && isLauncher);
                    });
                }
            }
        });

        const updatedXml = builder.buildObject(manifestObj);
        fs.writeFileSync(manifestPath, updatedXml, "utf-8");

        console.log("✔ Removed MAIN/LAUNCHER intent-filter from MainActivity");
    });
};