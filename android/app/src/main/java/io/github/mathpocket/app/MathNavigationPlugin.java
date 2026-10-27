package io.github.mathpocket.app;

import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Dispatches Android back through the saved-draft and modal rules. */
@CapacitorPlugin(name = "MathNavigation")
public class MathNavigationPlugin extends Plugin {
    private OnBackPressedCallback callback;

    @Override
    public void load() {
        getActivity().runOnUiThread(() -> {
            callback = new OnBackPressedCallback(false) {
                @Override
                public void handleOnBackPressed() {
                    notifyListeners("backPressed", new JSObject());
                }
            };
            getActivity().getOnBackPressedDispatcher().addCallback(getActivity(), callback);
        });
    }

    @PluginMethod
    public void setBackEnabled(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        getActivity().runOnUiThread(() -> {
            if (callback != null) callback.setEnabled(enabled);
            call.resolve();
        });
    }
}
