package com.test.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import org.apache.cordova.*;
import org.json.JSONArray;
import org.json.JSONException;

import java.util.List;

public class DynamicIcon extends CordovaPlugin {

    private static final String[] ALIAS_NAMES = {
        ".ClassicAlias",
        ".RetroAlias",
        ".PrivateAlias"
    };

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if ("setIcon".equals(action)) {
            String iconType = args.getString(0);
            switchIcon(iconType, callbackContext);
            return true;
        }
        return false;
    }

    private void switchIcon(String type, CallbackContext callbackContext) {
        Context context = cordova.getActivity().getApplicationContext();
        PackageManager pm = context.getPackageManager();
        String selectedAlias;
        switch (type.toLowerCase()) {
            case "classic":
                selectedAlias = ".ClassicAlias";
                break;
            case "retro":
                selectedAlias = ".RetroAlias";
                break;
            case "private":
                selectedAlias = ".PrivateAlias";
                break;
            default:
                callbackContext.error("Unknown icon type: " + type);
                return;
        }

        try {
            // for (String alias : ALIAS_NAMES) {
            //     pm.setComponentEnabledSetting(
            //         new ComponentName(context, context.getPackageName() + alias),
            //         alias.equals(selectedAlias)
            //             ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED
            //             : PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
            //         PackageManager.DONT_KILL_APP
            //     );
            // }
            for (String alias : ALIAS_NAMES) {
                if (alias.equals(selectedAlias)) {
                    // Disabling aliases that are not the selected one
                    packageManager.setComponentEnabledSetting(
                        new ComponentName(this, packageName + alias),
                        PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                        PackageManager.DONT_KILL_APP
                    );
                }
            }            
            for (String alias : ALIAS_NAMES) {
                if (!alias.equals(selectedAlias)) {
                    // Disabling aliases that are not the selected one
                    packageManager.setComponentEnabledSetting(
                        new ComponentName(this, packageName + alias),
                        PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                        PackageManager.DONT_KILL_APP
                    );
                }
            }
            
            
            // refresh launcher
            refreshLauncher(context);

            callbackContext.success("Icon changed to: " + type);
        } catch (Exception e) {
            callbackContext.error("Failed to switch icon: " + e.getMessage());
        }
    }

    private static void refreshLauncher(Context context) {
        Intent intent = new Intent(Intent.ACTION_MAIN);
        intent.addCategory(Intent.CATEGORY_HOME);
        intent.addCategory(Intent.CATEGORY_DEFAULT);

        List<ResolveInfo> resolveInfos = context.getPackageManager().queryIntentActivities(intent, 0);
        for (ResolveInfo info : resolveInfos) {
            Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(info.activityInfo.packageName);
            if (launchIntent != null) {
                context.sendBroadcast(launchIntent);
            }
        }
    }
}
