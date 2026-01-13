# Apple Auth Setup & Rotation Guide

This app uses Sign in with Apple via Supabase. Apple requires a **client_secret** (JWT) generated from a private `.p8` key.

**CRITICAL:** This secret **expires every 6 months** (max allowed by Apple). If it expires, Apple Sign-In will break.

## Next Rotation Date
**Monday, July 12, 2026**

---

## How to Generate the Secret

We have a script located at `scripts/generate_apple_secret.js` to do this for you.

### 1. Prerequisites
You need the Apple Key (`.p8` file) from the [Apple Developer Portal](https://developer.apple.com/account/resources/authkeys/list).
*   **Key Name:** Sign in with Apple
*   **Key ID:** (Found in the portal)
*   **Team ID:** (Found in the portal top-right)

### 2. Run the Script
1.  Open `scripts/generate_apple_secret.js`.
2.  Fill in the placeholders:
    *   `TEAM_ID`
    *   `KEY_ID`
    *   `P8_FILE_PATH` (Point to your downloaded `.p8` file)
3.  Run the script:
    ```bash
    cd scripts
    npm install jsonwebtoken # if not installed
    node generate_apple_secret.js
    ```
4.  **Copy the output JWT.**
5.  **Revert changes** to the script (Do not commit your real keys!).

### 3. Update Supabase
1.  Go to Supabase Dashboard > Authentication > Providers > Apple.
2.  Paste the new JWT into the **Secret Key** field.
3.  Save.

---

## Script Reference
The script (`scripts/generate_apple_secret.js`) uses the `es256` algorithm to sign a token with a 180-day expiration.

```javascript
// Excerpt from script
expiresIn: '180d', // Expires in 6 months (max allowed by Apple)
```

---

## How It Works (Under the Hood)

1.  **Client (App):** Uses `expo-apple-authentication` to request the user's Apple ID credential.
2.  **Apple:** Returns an **Identity Token** (JWT) to the app.
3.  **Client:** Sends this token to Supabase using `supabase.auth.signInWithIdToken()`.
4.  **Supabase:**
    *   Verifies the token's signature.
    *   Validates it against Apple's servers using the **Secret Key** (the one you generate every 6 months).
5.  **Result:** If valid, Supabase creates a user or logs them in and returns a session.

**Why the rotation?**
Apple does not provide a permanent secret. They require a time-based JWT signed by a private key to prove ownership. This adds security but requires this periodic manual step.

### The Nonce (Replay Protection)
A critical security feature in this flow is the **nonce**.
1.  **Generation:** Before the app requests the Apple ID, it generates a random string (nonce) and hashes it.
2.  **Request:** The app sends the logical hash of this nonce to Apple with the auth request.
3.  **Validation:** Apple embeds this nonce inside the returned Identity Token.
4.  **Verification:** Supabase checks that the nonce in the token matches the one the app generated.
**Why?** This prevents "Replay Attacks" where an attacker intercepts a valid token and tries to use it again later. Since the nonce changes every time, an old token is useless.
