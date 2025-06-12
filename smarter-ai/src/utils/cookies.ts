/**
 * Set a cookie with the specified name and value
 */
export function setCookie(name: string, value: string, days = 7) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | undefined {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const part = parts.pop();
        if (part) {
            return decodeURIComponent(part.split(';')[0]);
        }
    }
    return undefined;
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
} 