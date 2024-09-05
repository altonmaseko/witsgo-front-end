const AccessToken = require("../models/AccessToken");

const AccessTokenController = {
    async exists(query) {
        try {
            const exists = await AccessToken.exists(query);
            return exists !== null; // Returns true if a document exists, otherwise false
        } catch (error) {
            console.error("Error checking if document exists:", error);
            return false;
        }
    },

    async findOneRecord(query) {
        try {
            const doc = await AccessToken.findOne(query); // Use findOne instead of find for single document
            if (!doc) {
                return { success: false, message: "not_found" };
            }
            return { success: true, data: doc };
        } catch (error) {
            console.error("Error finding document:", error);
            return { success: false, message: "error_occurred" };
        }
    },

    async generate(obj) {
        try {
            const doc = await AccessToken.findOneAndReplace(
                { client_id: obj.client_id },
                {
                    client_id: obj.client_id,
                    access_token: obj.access_token,
                    scopes: obj.scopes,
                    expires_in: obj.expires_in,
                    refresh_token: obj.refresh_token
                },
                {
                    new: true,
                    upsert: true
                }
            );

            if (!doc) {
                return { success: false, message: "operation_failed" };
            }

            return { success: true, data: doc };
        } catch (error) {
            console.error("Error generating record:", error);
            return { success: false, message: "error_occurred" };
        }
    },

    async insert(obj) {
        try {
            // Check if a document with the same client_id already exists
            const existingDoc = await AccessToken.findOne({ client_id: obj.client_id });
            if (existingDoc) {
                return { success: false, message: "document_already_exists" };
            }

            const doc = new AccessToken(obj);
            const savedDoc = await doc.save();

            return { success: true, data: savedDoc };
        } catch (error) {
            console.error("Error inserting document:", error);
            return { success: false, message: "error_occurred" };
        }
    }
    
    // You can add other methods for ThirdPartyController here as needed
};

module.exports = AccessTokenController;
