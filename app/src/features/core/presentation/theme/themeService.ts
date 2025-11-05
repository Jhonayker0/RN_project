import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";

const THEME_KEY = "isDarkMode";

export class ThemeService {
  private subscribers: ((isDark: boolean) => void)[] = [];

  async isDark(): Promise<boolean> {
    const stored = await AsyncStorage.getItem(THEME_KEY);
    if (stored !== null) {
      return stored === "true";
    }
    const system = Appearance.getColorScheme();
    return system === "dark";
  }

  async toggleTheme(): Promise<boolean> {
    const current = await this.isDark();
    const next = !current;
    await AsyncStorage.setItem(THEME_KEY, next.toString());
    this.subscribers.forEach((callback) => callback(next));
    return next;
  }

  subscribe(callback: (isDark: boolean) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }
}

export const themeService = new ThemeService();
