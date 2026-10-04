# 0005 - Persist an explicit theme preference on each platform

Status: accepted

## Context

Decision 0004 established a light default and semantic palette roles. The second palette now needs one predictable preference contract across web and mobile. Browser storage is synchronous; native storage is asynchronous. Both platforms can report a changing system color scheme, and native OS chrome also needs the active scheme.

## Options

- Follow the system automatically when no user choice exists. This would unexpectedly switch existing users from the established light default.
- Store only a light/dark boolean. This prevents an operator from choosing to follow the system later.
- Store Light, Dark, or System, default to Light, and resolve the effective palette from the explicit choice before system appearance.

## Decision

Use the third option. The shared package validates the stored value and resolves precedence; each app owns its platform storage and appearance APIs. Web uses localStorage and a `prefers-color-scheme` listener. Mobile uses AsyncStorage and React Native Appearance on Android/iOS, with Expo configured for automatic appearance and `expo-system-ui` for Android. Expo web uses its browser appearance listener and skips the native-only Appearance override. Native waits for the saved choice before showing the app, avoiding a light-to-dark content flash. Failed storage writes are reported in the control. Theme state is presentation state and does not enter asset feature models or backend contracts.

## Consequences and verification

Light remains the first-run default. Explicit Light/Dark overrides system appearance; System follows changes and falls back to light if the platform reports no scheme. Web and mobile have independent local preferences; cross-device sync is out of scope. The theme gate checks both palettes for web/native token parity and 4.5:1 text contrast; pure precedence tests and a web selection/persistence test cover behavior. Android and iOS device interaction and screen-reader review remain required before release.