// Script to generate Apple Secret JWT from .p8 file, must every 6 months
// Dependencies: npm install --no-save jsonwebtoken
// Run: node generate_apple_secret.js (After info is filled)
const jwt = require('jsonwebtoken');
const fs = require('fs');

// FILL IN DETAILS HERE
const TEAM_ID = 'YOUR_TEAM_ID';       // e.g. 8X5XXXXXXX (From Apple Developer Account top right)
const KEY_ID = 'YOUR_KEY_ID';         // e.g. 4C9XXXXXXX (From the Key you created)
const P8_FILE_PATH = './AuthKey_XXXXXXXXXX.p8'; // Full path to your downloaded .p8 file

// ⚠️ DEV WARNING: Do not commit this file with filled details to version control! ⚠️

try {
    const privateKey = fs.readFileSync(P8_FILE_PATH);

    const token = jwt.sign({}, privateKey, {
        algorithm: 'ES256',
        expiresIn: '180d', // Expires in 6 months (max allowed by Apple)
        issuer: TEAM_ID,
        header: {
            alg: 'ES256',
            kid: KEY_ID,
        },
        audience: 'https://appleid.apple.com',
        subject: 'com.shpenjit.officialapp', // Bundle ID (Public)
    });

    console.log('\n✅ Your Apple Secret JWT (valid for 6 months):');
    console.log('---------------------------------------------------');
    console.log(token);
    console.log('---------------------------------------------------\n');
    console.log('👉 Copy the token above and paste it into the "Secret Key" field in Supabase.');

} catch (error) {
    console.error('\n❌ Error generating token:', error.message);
    console.error('Make sure the P8_FILE_PATH is correct and points to your downloaded file.\n');
}
