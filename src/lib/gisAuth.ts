import firebaseConfig from '../../firebase-applet-config.json';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

/**
 * Dynamically loads the Google Identity Services client script into the DOM.
 */
export function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return resolve();
    }

    if (window.google?.accounts?.id) {
      return resolve();
    }

    const existingScript = document.getElementById('google-gsi-client') as HTMLScriptElement;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', (e) => reject(e));
      // In case it already finished loading
      if (window.google?.accounts?.id) {
        return resolve();
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(new Error('Failed to load Google Identity Services SDK'));
    document.head.appendChild(script);
  });
}

/**
 * Decodes and extracts verified claims from a standard JWT token payload without external dependencies.
 */
export function parseJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Failed to parse JWT token payload:', err);
    return null;
  }
}

/**
 * Renders the official Google Sign-In button into a container element.
 */
export async function renderGoogleSignInButton(
  container: HTMLElement,
  onSuccess: (googleIdToken: string) => void,
  onError?: (err: any) => void
): Promise<void> {
  try {
    await loadGisScript();

    if (!window.google?.accounts?.id) {
      throw new Error('Google Identity Services SDK is not available');
    }

    const clientId = firebaseConfig.oAuthClientId;
    if (!clientId) {
      throw new Error('No oAuthClientId configured in firebase-applet-config.json');
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: any) => {
        if (response && response.credential) {
          onSuccess(response.credential);
        } else {
          onError?.(new Error('Google did not return a valid credential'));
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    container.innerHTML = '';
    window.google.accounts.id.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: Math.min(Math.max(container.clientWidth || 300, 240), 380),
    });
  } catch (err) {
    console.error('Error rendering Google Sign-In button:', err);
    onError?.(err);
  }
}
