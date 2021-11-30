const { google } = require("googleapis");
const fs = require('fs');
const sheets = google.sheets('v4')
const SPREADSHEET_ID = "1SGEq_CWDrKnysX2aJrSrshbwXVJDGFXjjyp-1mRiNlM";
const KEY_FILE_PATH = 'keys.json';

function getClient(credentials) {
    return new Promise(async (resolve, reject) => {
        try {
            const { client_email, private_key } = credentials;
            const client = new google.auth.JWT(
                client_email,
                null,
                private_key,
                ['https://www.googleapis.com/auth/spreadsheets'],
                null
            );

            client.authorize((err, tokens) => {
                if (err) {
                    throw err;
                } else {
                    console.log("Successfully connected!");
                    resolve(client);
                }
            });
            resolve(client);
        } catch (error) {
            reject(error);
        }
    });
}

function appendRecordToSpreadSheets({ spreadsheetId, rowRecord, authClient }) {
    return new Promise((resolve, reject) => {
        sheets.spreadsheets.values.append({
            spreadsheetId: spreadsheetId,
            range: 'Form data',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                "majorDimension": "ROWS",
                "values": [rowRecord]
            },
            auth: authClient,
        }).then(value => {
            resolve(value);
        }).catch(err => {
            reject(err);
        });
    });
}

function readSecretKeyFile(secretKeyFilePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(secretKeyFilePath, async (err, content) => {
            if (err) reject(err);
            resolve(JSON.parse(content));
        });
    })
}

exports.handler = async (event) => {
    try {
        const { email, lastName, firstName } = JSON.parse(event.body);
        const credentials = await readSecretKeyFile(KEY_FILE_PATH);
        const authClient = await getClient(credentials);
        await appendRecordToSpreadSheets({
            authClient,
            spreadsheetId: SPREADSHEET_ID,
            rowRecord: [email, lastName, firstName, new Date()]
        })
        return {
            statusCode: 200
        }
    } catch (error) {
        console.error(error);
        return {
            statusCode: 400
        }
    }
}
