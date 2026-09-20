import { ref } from 'vue';

export const useAppleSignIn = () => {
    const router = useRouter();
    const config = useRuntimeConfig();
    const appleClientId = (config.public.appleClientId as string) || 'cloud.eka-dev.portfolio';

    const appleSignInError = ref<string | null>(null);
    const isAppleLoading = ref(false);

    const getCurrentDomain = (): string => {
        if (import.meta.server) {
            return 'https://eka-dev.cloud';
        }
        const currentHost = window.location.hostname;
        const protocol = window.location.protocol;
        return `${protocol}//${currentHost}`;
    };

    const loadAppleScript = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (import.meta.server) return resolve();
            if ((window as any).AppleID) return resolve();

            const existing = document.getElementById('apple-auth-sdk');
            if (existing) {
                existing.addEventListener('load', () => resolve());
                existing.addEventListener('error', () => reject(new Error('Failed to load Apple ID SDK')));
                return;
            }

            const script = document.createElement('script');
            script.id = 'apple-auth-sdk';
            script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Apple ID SDK'));
            document.head.appendChild(script);
        });
    };

    const initAppleSDK = async () => {
        await loadAppleScript();
        if (!(window as any).AppleID) {
            throw new Error('Apple ID SDK is not available');
        }

        const redirectUri = `${getCurrentDomain()}/`;
        (window as any).AppleID.auth.init({
            clientId: appleClientId,
            scope: 'name email',
            redirectURI: redirectUri,
            state: 'apple_oauth_state',
            usePopup: true,
        });
    };

    // Sign in with Apple on login page
    const signInWithApple = async () => {
        isAppleLoading.value = true;
        appleSignInError.value = null;

        try {
            await initAppleSDK();
            console.log('[Apple Auth] Triggering Apple Sign-In popup...');

            const authResponse = await (window as any).AppleID.auth.signIn();
            const idToken = authResponse?.authorization?.id_token;

            if (!idToken) {
                throw new Error('No identity token received from Apple');
            }

            console.log('[Apple Auth] Identity token received, authenticating with backend...');

            const clientEmail = authResponse.user?.email || null;
            const clientName = authResponse.user?.name || null;

            const result = await $fetch('/api/users/apple-login', {
                method: 'POST',
                credentials: 'include',
                body: {
                    identityToken: idToken,
                    email: clientEmail,
                    name: clientName,
                },
            }) as any;

            if (!result?.data?.access_token) {
                throw new Error(result?.message || 'Failed to authenticate with Apple');
            }

            const token = useCookie('token', {
                maxAge: 86400,
                path: '/',
                sameSite: 'lax',
                secure: import.meta.env.PROD,
            });
            token.value = result.data.access_token;

            appleSignInError.value = null;
            await router.push('/dashboard');
            return true;
        } catch (error: any) {
            // Check if user closed popup
            if (error?.error === 'popup_closed_by_user') {
                console.log('[Apple Auth] User closed popup window');
                return false;
            }
            appleSignInError.value = error?.message || error?.error || 'Apple Sign-In failed';
            console.error('[Apple Auth] Error:', appleSignInError.value, error);
            return false;
        } finally {
            isAppleLoading.value = false;
        }
    };

    // Authorize Apple ID for account binding
    const authorizeAppleForBinding = async (): Promise<{ identityToken: string; email?: string | null } | null> => {
        isAppleLoading.value = true;
        appleSignInError.value = null;

        try {
            await initAppleSDK();
            console.log('[Apple Auth] Triggering Apple authorization for binding...');

            const authResponse = await (window as any).AppleID.auth.signIn();
            const idToken = authResponse?.authorization?.id_token;

            if (!idToken) {
                throw new Error('No identity token received from Apple');
            }

            const clientEmail = authResponse.user?.email || null;
            return {
                identityToken: idToken,
                email: clientEmail,
            };
        } catch (error: any) {
            if (error?.error === 'popup_closed_by_user') {
                console.log('[Apple Auth] User closed popup window');
                return null;
            }
            appleSignInError.value = error?.message || error?.error || 'Apple authorization failed';
            console.error('[Apple Auth] Binding Auth Error:', appleSignInError.value, error);
            return null;
        } finally {
            isAppleLoading.value = false;
        }
    };

    return {
        signInWithApple,
        authorizeAppleForBinding,
        isAppleLoading,
        appleSignInError,
    };
};
