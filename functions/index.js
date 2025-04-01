const functions = require('firebase-functions/v1');
var admin = require("firebase-admin");

var serviceAccount = require("./key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

exports.createUser = functions.auth.user().onCreate(async (user) => {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(user.uid);

    const userData = {
        email: user.email || null,
        displayName: user.displayName || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        tokens: 1,
        pro_user: false
    };

    try {
        await userRef.set(userData);
        console.log(`User document created for: ${user.uid}`);
    } catch (error) {
        console.error(`Error creating user document: ${error}`);
    }
});

exports.uploadImage = functions.https.onCall(async (data, context) => {
    console.log("uploaded", data.fileName)
    console.log("uploaded file b64", data.image)
    return ("hi")
    // try {
    //     if (!data.image || !data.fileName) {
    //         throw new functions.https.HttpsError("invalid-argument", "Image data and filename are required");
    //     }

    //     const imageBuffer = Buffer.from(data.image, "base64");
    //     const filePath = `uploads/${uuidv4()}-${data.fileName}`;
    //     const file = bucket.file(filePath);

    //     await file.save(imageBuffer, {
    //         metadata: {
    //             contentType: "image/png" // Adjust content type as needed
    //         }
    //     });

    //     const [url] = await file.getSignedUrl({
    //         action: "read",
    //         expires: Date.now() + 60 * 60 * 1000, // 1-hour expiration
    //     });

    //     return { url };
    // } catch (error) {
    //     throw new functions.https.HttpsError("internal", "Error uploading image", error);
    // }
});

// TESTING CALLABLE FUNCTION
//takes in data and context
exports.sayHello = functions.https.onCall((data, context) => {
    return { message: "Hello, ninjas" }; // ✅ Return an object
})