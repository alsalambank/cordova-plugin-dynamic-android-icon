package __PACKAGE__;
import android.content.ComponentName;
import android.content.Context;
import android.content.pm.PackageManager;
import org.apache.cordova.*;
import org.json.JSONArray;
import org.json.JSONException;

public class DynamicIcon extends CordovaPlugin {

    private static final String[] ALIAS_NAMES = {
        "__PACKAGE__.ClassicAlias",
        "__PACKAGE__.RetroAlias",
        "__PACKAGE__.PrivateAlias"
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
                selectedAlias = "__PACKAGE__.ClassicAlias";
                break;
            case "retro":
                selectedAlias = "__PACKAGE__.RetroAlias";
                break;
            case "private":
                selectedAlias = "__PACKAGE__.PrivateAlias";
                break;
            default:
                callbackContext.error("Unknown icon type: " + type);
                return;
        }

        try {
            for (String alias : ALIAS_NAMES) {
                pm.setComponentEnabledSetting(
                    new ComponentName(context, alias),
                    alias.equals(selectedAlias)
                        ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                        : PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                    PackageManager.DONT_KILL_APP
                );
            }
            callbackContext.success("Icon changed to: " + type);
        } catch (Exception e) {
            callbackContext.error("Failed to switch icon: " + e.getMessage());
        }
    }
}
