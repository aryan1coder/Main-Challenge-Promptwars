# Civic Air Quality Briefing Studio — Security Policy & Controls

> **Document Version:** 1.0.0  
> **Status:** Active Security Standards

---

## 1. Secrets & Environment Variable Management

In single-page client applications, environment variables prefixed with `VITE_` are bundled into the public client distribution. The following controls apply:

1. **Strict Client-Side Boundary:**
   - Only public client keys (e.g., Firebase web client API key, public Gemini client endpoint keys intended for hackathon client demos) may be placed in client `.env` files.
   - **Never** place private service account keys (`service-account.json`, admin SDK tokens, or administrative database credentials) in frontend repositories.
2. **Repository Protection:**
   - `.gitignore` explicitly excludes `.env`, `.env.local`, and all variations (`.env.*.local`).
   - `.env.example` contains only sanitized dummy keys.
   - Any accidental commit of active keys must be treated as a high-severity security incident requiring immediate key revocation in Google AI Studio or Firebase Console.

---

## 2. Input Validation & XSS Prevention

1. **File Upload Verification:**
   - Restrict uploads strictly to `.csv`, `.tsv`, and `.txt` MIME types.
   - Maximum upload size capped at $5\,\text{MB}$ to prevent client-side denial of service (DoS) and browser memory exhaustion.
2. **Cross-Site Scripting (XSS) Mitigation:**
   - All user-supplied table data, column names, and prompt overrides are treated as untrusted strings.
   - Text rendering uses React's native JSX escaping (`<div>{untrustedText}</div>`).
   - Markdown rendering of AI responses strictly avoids raw HTML execution (`rehype-raw` is disabled or stripped).
   - Input sanitization strips executable script tags while avoiding destructive replacement of legitimate mathematical symbols ($<$, $>$).

---

## 3. Authentication & Authorization

1. **Firebase Authentication:**
   - Supports Google OAuth for verified user identity.
   - Session tokens are managed by Firebase SDK using secure `HttpOnly` and partitioned storage cookies where supported.
2. **Access Control:**
   - Anonymous/guest mode allows local analysis without cloud persistence.
   - Cloud Firestore saves require an authenticated session or explicit anonymous user token to prevent open database spam.

---

## 4. Cloud Firestore Security Rules (Target Architecture)

When Firebase Firestore is linked, open write rules are strictly prohibited. Production rules enforce least-privilege data access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow users to read and write their own briefing documents
    match /briefings/{briefingId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Public incident briefings (read-only for citizens)
    match /public_advisories/{advisoryId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
  }
}
```

---

## 5. Security Verification Checklist

- [ ] `.env` and `.env.local` are listed in `.gitignore` and not tracked by Git.
- [ ] No private service account keys or passwords committed.
- [ ] File uploads validate MIME type and size boundaries.
- [ ] Markdown renderer does not execute arbitrary `<script>` or `<iframe>` tags.
- [ ] API error messages returned to the user strip internal stack traces and secrets.
- [ ] Input strings are validated before processing.
