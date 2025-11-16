const admin = require("firebase-admin");

// Initialize Firebase Admin
// For development, you can use a service account key JSON file
// For production, use environment variables or secure storage

let db;

const initializeFirebase = () => {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      db = admin.firestore();
      return db;
    }

    // Try to load service account from file first (local dev)
    try {
      const serviceAccount = require("../../serviceAccountKey.json");
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase initialized with local serviceAccountKey.json");
    } catch (fileError) {
      // If no file, try environment variables.
      // Support two environment formats to avoid newline/escaping problems:
      // 1) FIREBASE_SERVICE_ACCOUNT (raw JSON string)
      // 2) FIREBASE_SERVICE_ACCOUNT_BASE64 (base64-encoded JSON)

      const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
      const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

      if (raw || b64) {
        let parsed;
        try {
          if (b64) {
            // decode base64 safely
            const json = Buffer.from(b64, "base64").toString("utf8");
            parsed = JSON.parse(json);
          } else {
            parsed = JSON.parse(raw);
          }
        } catch (parseErr) {
          console.error(
            "❌ Failed to parse Firebase service account JSON:",
            parseErr.message
          );
          throw new Error(
            "Invalid Firebase service account JSON in environment variable"
          );
        }

        // Basic validation of parsed object
        if (!parsed.project_id || !parsed.client_email) {
          console.error(
            "❌ Firebase service account JSON appears invalid - missing project_id or client_email"
          );
          throw new Error("Incomplete Firebase service account JSON");
        }

        // Initialize
        admin.initializeApp({
          credential: admin.credential.cert(parsed),
        });
        console.log("✅ Firebase initialized with environment service account");
      } else if (process.env.FIREBASE_PROJECT_ID) {
        // If user only provides project id, use application default credentials (may have limited access)
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
        console.log(
          "⚠️ Firebase initialized with project ID only (no service account). This may fail for restricted operations."
        );
      } else {
        console.error(
          "❌ No Firebase credentials found in file or environment variables."
        );
        throw new Error("No Firebase credentials found");
      }
    }

    db = admin.firestore();
    return db;
  } catch (error) {
    // Log full error object for debugging (do not leak secrets in public logs)
    console.error(
      "❌ Error initializing Firebase:",
      error && error.message ? error.message : error
    );
    throw error;
  }
};

const getDb = () => {
  if (!db) {
    return initializeFirebase();
  }
  return db;
};

module.exports = { initializeFirebase, getDb, admin };
