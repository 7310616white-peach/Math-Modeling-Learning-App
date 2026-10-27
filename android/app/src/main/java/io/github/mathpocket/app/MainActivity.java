package io.github.mathpocket.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle state) {
        registerPlugin(MathNavigationPlugin.class);
        super.onCreate(state);
    }
}
