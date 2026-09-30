# Society Loan Management System - Firebase Setup Guide

This document describes the complete, step-by-step setup procedure for deploying and running the **Society Loan Management System** with **Firebase Authentication** and **Cloud Firestore**.

---

## 1. Firebase Project Creation

1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Name your project: `society-loan-system` (or your preferred project name).
4. (Optional) Disable or enable Google Analytics based on your preference, and click **Create Project**.

---

## 2. Register Web Application

1. In the Project Overview page, click the Web icon (`</>`) to add a web app.
2. App nickname: `society-loan-web`.
3. (Optional) Check **Also set up Firebase Hosting**.
4. Click **Register app**.
5. Copy your Firebase configuration credentials object:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
6. Paste these credentials into:
   - `src/environments/environment.ts`
   - `src/environments/environment.prod.ts`

---

## 3. Enable Firebase Authentication

1. In the Firebase Console left menu, navigate to **Build > Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, select **Email/Password**.
4. Toggle **Enable** (leave Email link disabled) and click **Save**.

---

## 4. Initial Admin Account Creation

### Production Administrator Credentials:
- **Admin Email:** `sunilnirwan55@gmail.com`
- **Initial Password:** `sunil@1234`
  > **SECURITY NOTE:** Change this initial password immediately after the first successful login in production.

### Method A: Through Firebase Console (Recommended)
1. In Firebase Console, go to **Authentication > Users**.
2. Click **Add user**.
3. Enter:
   - **Email:** `sunilnirwan55@gmail.com`
   - **Password:** `sunil@1234`
4. Click **Add user**.
5. Copy the generated **User UID** for this account.

---

## 5. Enable Cloud Firestore Database

1. In the left menu, navigate to **Build > Firestore Database**.
2. Click **Create database**.
3. Choose a database location close to your users (e.g., `asia-south1` for India / Jaipur).
4. Start in **Production mode** (Security rules will be deployed in the next step).
5. Click **Create**.

---

## 6. Create Admin Firestore User Document

To grant administrator permissions in Cloud Firestore:

1. In Firestore, click **Start collection** with collection ID: `users`.
2. Set the **Document ID** to the exact **Firebase Authentication UID** copied in Step 4.
3. Add the following document fields:

| Field Name | Type | Value |
|---|---|---|
| `uid` | string | `[PASTE_AUTH_UID_HERE]` |
| `userId` | string | `ADMIN001` |
| `name` | string | `Sunil Nirwan` |
| `email` | string | `sunilnirwan55@gmail.com` |
| `role` | string | `admin` |
| `totalAmount` | number | `0` |
| `status` | string | `active` |
| `createdAt` | timestamp | Current Timestamp |

> **Automated Provisioning Note:** The application's `AuthService` also detects the first sign-in of `sunilnirwan55@gmail.com` and automatically seeds the `users/{uid}` document if not already present.

---

## 7. Initialize Firestore Counters (For Atomic Sequential IDs)

Create the `counters` collection for atomic, concurrency-safe sequential IDs:

1. Collection ID: `counters`
2. Document ID: `users`
   - Field: `lastNumber` (number) -> `0` (or `25` if migrating existing 25 members)
3. Document ID: `loans`
   - Field: `lastNumber` (number) -> `0`
4. Document ID: `payments`
   - Field: `lastNumber` (number) -> `0`

---

## 8. Deploy Firestore Security Rules

Deploy the included `firestore.rules` file to enforce role-based access control and prevent client-side tampering of roles or balances:

### Using Firebase CLI:
```bash
# Login to Firebase
npx firebase login

# Select or use the project
npx firebase use --add

# Deploy Firestore rules and indexes
npx firebase deploy --only firestore:rules,firestore:indexes
```

### Alternatively, paste directly in Firebase Console:
1. Open **Firestore Database > Rules**.
2. Replace all content with the contents of `firestore.rules` located in the root of this project.
3. Click **Publish**.

---

## 9. Firestore Indexes

The application requires composite indexes for user-specific real-time sorting. Deploy them using:
```bash
npx firebase deploy --only firestore:indexes
```
Or paste the definitions from `firestore.indexes.json` in **Firestore > Indexes**.

---

## 10. Local Firebase Emulator Suite (Optional Testing)

To test the application locally without creating live Firebase resources:

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Start the local emulators:
   ```bash
   npx firebase emulators:start
   ```
   - Auth Emulator runs on `http://localhost:9099`
   - Firestore Emulator runs on `http://localhost:8080`
   - Emulator UI runs on `http://localhost:4000`
3. In `src/environments/environment.ts`, toggle:
   ```typescript
   useEmulators: true
   ```
4. Start the Angular application:
   ```bash
   npm start
   ```

---

## 11. Run the Angular Application

1. Install project dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm start
   ```
3. Open your browser at:
   ```
   http://localhost:4200
   ```

---

## 12. Security Verification Checklist

- [x] Unauthenticated users cannot read or write to private user data.
- [x] Regular members cannot modify their own `role` or `totalAmount`.
- [x] Regular members can only view their own loans, installments, payments, and transactions.
- [x] Loans enforce a 12-month fixed repayment schedule where `monthlyInstallment = loanAmount / 12`.
- [x] Admin (`sunilnirwan55@gmail.com`) has full management access over all members, loans, payments, and transactions.
- [x] Member IDs (`SOCITY0001`, `SOCITY0002`...) and Loan IDs (`LOAN0001`...) are generated via atomic Firestore transactions to eliminate race conditions.
