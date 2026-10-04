# Theme preference rules

This package owns the platform-neutral `light`, `dark`, and `system` preference values, storage key, validation, and effective-scheme resolution. No browser, React, Expo, or native storage API belongs here. Web and mobile provide their own persistence and system-appearance adapters.

An absent or malformed stored value resolves to light. An explicit light or dark choice overrides the system. System mode follows the device or browser and falls back to light if no scheme is available.