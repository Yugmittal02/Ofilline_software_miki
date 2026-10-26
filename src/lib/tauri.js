import { invoke as coreInvoke } from '@tauri-apps/api/core'
import { handleMockCommand } from './mockBackend'

/**
 * Detect whether we're running inside the Tauri desktop shell.
 */
function isTauri() {
  return typeof window !== 'undefined' && (!!window.__TAURI_INTERNALS__ || !!window.__TAURI__)
}

/**
 * Typed wrapper around Tauri's invoke() with unified error handling.
 * Supports both official @tauri-apps/api/core and window.__TAURI__ global.
 * Falls back to an in-browser mock backend when not running inside Tauri
 * (e.g. `npm run dev` on localhost).
 */
export async function call(command, args = {}) {
  try {
    if (isTauri()) {
      const invokeFn = coreInvoke || window.__TAURI__?.core?.invoke
      if (typeof invokeFn === 'function') {
        return await invokeFn(command, args)
      }
    }
    // Browser / localhost fallback — fully mocked with localStorage
    return await handleMockCommand(command, args)
  } catch (err) {
    throw typeof err === 'string' ? err : (err?.message ?? 'Unknown error')
  }
}
