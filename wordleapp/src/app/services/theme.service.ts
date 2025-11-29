import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkModeSubject = new BehaviorSubject<boolean>(true); // Default to dark mode
  public isDarkMode$ = this.isDarkModeSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('darkMode');
      // Default to dark mode unless explicitly set to light
      if (savedTheme === 'false') {
        this.disableDarkMode();
      } else {
        this.enableDarkMode();
      }
    }
  }

  toggleDarkMode(): void {
    if (this.isDarkModeSubject.value) {
      this.disableDarkMode();
    } else {
      this.enableDarkMode();
    }
  }

  enableDarkMode(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
      this.isDarkModeSubject.next(true);
    }
  }

  disableDarkMode(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
      this.isDarkModeSubject.next(false);
    }
  }

  isDarkMode(): boolean {
    return this.isDarkModeSubject.value;
  }
}
