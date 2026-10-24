import { invoke as coreInvoke } from '@tauri-apps/api/core'

/**
 * Typed wrapper around Tauri's invoke() with unified error handling.
 * Supports both official @tauri-apps/api/core and window.__TAURI__ global.
 */
export async function call(command, args = {}) {
  try {
    const invokeFn = coreInvoke || window.__TAURI__?.core?.invoke
    if (typeof invokeFn === 'function') {
      return await invokeFn(command, args)
    }
    throw new Error('Tauri API not available — make sure the app is running inside Tauri')
  } catch (err) {
    throw typeof err === 'string' ? err : (err?.message ?? 'Unknown error')
  }
}

