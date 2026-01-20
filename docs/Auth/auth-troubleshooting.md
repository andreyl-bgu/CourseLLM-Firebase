# Google Authentication Troubleshooting Guide

## Common Issues and Solutions

### 🔴 Critical Issue: Missing Redirect Result Handling

**Problem:** When popup-based sign-in fails (due to popup blockers, COOP/COEP policies, or third-party cookie restrictions), the code falls back to `signInWithRedirect`. However, the app **never calls `getRedirectResult()`** to process the authentication result when the user returns from Google's OAuth page.

**Symptoms:**
- User clicks "Sign in with Google"
- Gets redirected to Google, authenticates successfully
- Returns to the app but remains logged out
- No error messages shown
- Works on some computers but not others (depends on browser settings)

**Solution:** The app must call `getRedirectResult()` on page load to handle OAuth redirects. See the fix in `src/components/AuthProviderClient.tsx`.

---

### 1. Missing or Incorrect Environment Variables

**Problem:** Firebase configuration requires all environment variables to be set correctly.

**Check:**
```bash
# Verify these are set in .env.local:
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

**Solution:**
- Ensure `.env.local` exists in the project root
- Copy from `.env.local.example` if needed
- Restart the dev server after changing env vars
- Verify values match your Firebase project settings

---

### 2. Firebase Console Configuration

**Problem:** Google sign-in provider not enabled or authorized domains not configured.

**Check in Firebase Console:**
1. Go to **Authentication → Sign-in method**
2. Ensure **Google** provider is enabled
3. Check **Authorized domains** includes:
   - Your production domain (e.g., `yourdomain.com`)
   - `localhost` (for development)
   - Any custom domains you're using

**Solution:**
- Enable Google provider if disabled
- Add missing domains to authorized domains list
- Wait a few minutes for changes to propagate

---

### 3. Browser Security Policies

**Problem:** Modern browsers block popups or third-party cookies, causing popup-based auth to fail.

**Common causes:**
- **Popup blockers** enabled in browser
- **Cross-Origin-Opener-Policy (COOP)** or **Cross-Origin-Embedder-Policy (COEP)** headers
- **Third-party cookies** disabled
- **Strict privacy mode** (Safari, Firefox, etc.)
- **Embedded contexts** (iframe, webview)

**Symptoms:**
- Popup opens then immediately closes
- Error: "Popup blocked" or "cross-origin" errors
- Works in some browsers but not others

**Solution:**
- The code should automatically fall back to redirect-based auth
- **However, redirect result must be handled** (see Critical Issue above)
- Users can enable third-party cookies (if allowed by policy)
- Users can allow popups for your domain

---

### 4. Network/Firewall Issues

**Problem:** Corporate networks or firewalls may block Firebase/Google OAuth endpoints.

**Check:**
- Can access `accounts.google.com`?
- Can access `*.googleapis.com`?
- Can access `*.firebaseapp.com`?

**Solution:**
- Check network/firewall rules
- Try from a different network
- Contact IT if on corporate network

---

### 5. Browser Compatibility

**Problem:** Some browsers or browser versions may not support Firebase Auth features.

**Check:**
- Browser console for errors
- Browser version (should be recent)
- Try a different browser

**Solution:**
- Update browser to latest version
- Try Chrome, Firefox, or Safari
- Check Firebase Auth browser compatibility

---

### 6. CORS/Origin Mismatch

**Problem:** The `authDomain` in Firebase config doesn't match the actual domain.

**Check:**
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` should match your Firebase project's auth domain
- Usually: `your-project-id.firebaseapp.com` or `your-project-id.web.app`
- Must match exactly (including protocol, subdomain, port)

**Solution:**
- Verify `authDomain` in Firebase Console → Project Settings
- Update `.env.local` to match exactly
- Restart dev server

---

### 7. Development vs Production Environment

**Problem:** Different behavior between local development and production.

**Common differences:**
- Different Firebase projects (dev vs prod)
- Different authorized domains
- Different environment variables
- HTTPS required in production (not HTTP)

**Solution:**
- Ensure production uses correct Firebase project
- Verify production environment variables are set
- Use HTTPS in production (Firebase Auth requires it)

---

## Debugging Steps

1. **Check browser console** for errors
   - Open DevTools (F12)
   - Look for Firebase/auth errors
   - Check Network tab for failed requests

2. **Check Firebase config** is loaded
   - Look for "Firebase config check" logs in console
   - Verify all config values are present (not `undefined`)

3. **Test popup vs redirect**
   - Try allowing popups and see if it works
   - Check if redirect flow works (after fix)

4. **Verify environment variables**
   ```bash
   # In browser console:
   console.log({
     apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...',
     authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
     projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
   })
   ```

5. **Check Firebase Auth state**
   ```javascript
   // In browser console:
   import { auth } from '@/lib/firebase'
   console.log('Current user:', auth.currentUser)
   ```

---

## Quick Fix Checklist

- [ ] All Firebase env vars set in `.env.local`
- [ ] Google provider enabled in Firebase Console
- [ ] Authorized domains include your domain
- [ ] `getRedirectResult()` handler added (see fix)
- [ ] Browser allows popups/third-party cookies (or redirect works)
- [ ] Network allows access to Google/Firebase endpoints
- [ ] Using HTTPS in production
- [ ] Browser console shows no errors

---

## Related Files

- `src/lib/firebase.ts` - Firebase initialization
- `src/lib/authService.ts` - Auth service with popup/redirect logic
- `src/components/AuthProviderClient.tsx` - Auth context provider (needs redirect result handler)
- `src/app/login/page.tsx` - Login page UI
- `docs/Auth/auth-implementation.md` - Implementation details
