export type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error";

export const HAPTICS_KEY = "wallio_haptics_off";
export const isHapticsEnabled = () => typeof localStorage !== "undefined" && localStorage.getItem(HAPTICS_KEY) !== "1";

export async function haptic(style: HapticStyle = "light"): Promise<void> {
  if (!isHapticsEnabled()) return;
  try {
    // @capacitor/haptics — disponible uniquement sur iOS/Android natif
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import("@capacitor/haptics" as any);
    const { Haptics, ImpactStyle, NotificationType } = mod;
    switch (style) {
      case "light":   await Haptics.impact({ style: ImpactStyle.Light });               return;
      case "medium":  await Haptics.impact({ style: ImpactStyle.Medium });              return;
      case "heavy":   await Haptics.impact({ style: ImpactStyle.Heavy });               return;
      case "success": await Haptics.notification({ type: NotificationType.Success });   return;
      case "warning": await Haptics.notification({ type: NotificationType.Warning });   return;
      case "error":   await Haptics.notification({ type: NotificationType.Error });     return;
    }
  } catch {
    // Plugin absent ou navigateur web — fallback vibration Android
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      const p: Record<HapticStyle, number | number[]> = {
        light: 10, medium: 20, heavy: 35,
        success: [10, 40, 10], warning: [30], error: [50, 30, 50],
      };
      navigator.vibrate(p[style]);
    }
  }
}
