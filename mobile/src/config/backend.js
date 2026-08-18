import { NativeModules, Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
// Priority order for determining the backend URL:
//   1. EXPO_PUBLIC_API_URL  — full URL override (e.g. http://10.73.22.2:5000/api)
//   2. EXPO_PUBLIC_API_HOST — just the IP/hostname (port from EXPO_PUBLIC_API_PORT)
//   3. Auto-detect from Metro bundler scriptURL (works on emulator, not tunnel)
//   4. HARDCODED_FALLBACK_IP — set this if you always test on a hotspot
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_API_PORT = process.env.EXPO_PUBLIC_API_PORT || '5000';

// *** IMPORTANT: Set this to your laptop's Wi-Fi/hotspot IP ***
// Run `ipconfig` in PowerShell and find your Wi-Fi adapter IPv4 address.
// This is used when Expo tunnel mode can't auto-detect the LAN IP.
const HARDCODED_FALLBACK_IP = '192.168.1.24';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function getHostFromScriptUrl() {
  const scriptUrl = NativeModules?.SourceCode?.scriptURL;
  if (!scriptUrl) return '';

  try {
    return new URL(scriptUrl).hostname;
  } catch (error) {
    const match = String(scriptUrl).match(/https?:\/\/([^/:]+)/i);
    return match ? match[1] : '';
  }
}

function sanitizeUrl(value) {
  return String(value || '').trim().replace(/\/$/, '');
}

export function resolveApiBaseUrl() {
  // 1. Explicit full URL from environment
  const explicitUrl = sanitizeUrl(process.env.EXPO_PUBLIC_API_URL);
  if (explicitUrl) {
    return explicitUrl;
  }

  // 2. Host-only from environment
  const configuredHost = sanitizeUrl(process.env.EXPO_PUBLIC_API_HOST);
  if (configuredHost) {
    const hostOnly = configuredHost.replace(/^https?:\/\//i, '');
    return `http://${hostOnly}:${DEFAULT_API_PORT}/api`;
  }

  // 3. Web platform — use window.location
  if (Platform.OS === 'web') {
    const webHost = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost';
    return `http://${webHost}:${DEFAULT_API_PORT}/api`;
  }

  // 4. Try auto-detect from Metro bundler (works in LAN mode, not tunnel)
  const scriptHost = getHostFromScriptUrl();
  if (scriptHost && !LOOPBACK_HOSTS.has(scriptHost) && !scriptHost.includes('exp.direct') && !scriptHost.includes('ngrok') && !scriptHost.includes('tunnel')) {
    return `http://${scriptHost}:${DEFAULT_API_PORT}/api`;
  }

  // 5. Use the hardcoded fallback IP (your laptop's hotspot/LAN IP)
  return `http://${HARDCODED_FALLBACK_IP}:${DEFAULT_API_PORT}/api`;
}
