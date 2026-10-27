import { Capacitor, registerPlugin } from '@capacitor/core';
import { BackHandlers } from '../domain/backHandlers.js';
const native = registerPlugin('MathNavigation');
export const backHandlers = new BackHandlers();
export async function startNativeNavigation() {
  if (!Capacitor.isNativePlatform()) return;
  const fail = () => window.dispatchEvent(new Event('math:native-navigation-error'));
  await native.addListener('backPressed', () => {
    backHandlers.run().catch(fail);
  });
  backHandlers.observe((enabled) => {
    native.setBackEnabled({ enabled }).catch(fail);
  });
}
