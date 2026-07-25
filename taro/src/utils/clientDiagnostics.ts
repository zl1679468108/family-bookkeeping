/**
 * Client-side diagnostics sink.
 *
 * Keep Taro pages/components free of direct console output. This can be wired
 * to remote reporting later without changing call sites.
 */
export function reportClientError(_scope: string, _error: unknown): void {}

export function reportClientWarning(_scope: string, _error: unknown): void {}
