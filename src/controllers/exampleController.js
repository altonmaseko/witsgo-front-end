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


    async findOneRecord(query){
        const doc = await AccessToken.find(query);
        if (!doc){
            return {success:false,message:"not_found"};
        }
        return {success:true,data:doc};
    },


    async generate(obj){
        let doc = await AccessToken.findOneAndReplace(
            {client_id:obj.client_id},
            {
                client_id:obj.client_id,
                access_token:obj.access_token,
                scopes:obj.scopes,
                expires_in:obj.expires_in,
                refresh_token:obj.refresh_token
            },
            {
                new: true,
                upsert: true

            }
        );

        if (!doc){
            return {success:false,message:"operation_failed"}
        }

        return {success:true,data:doc};
    }
    
    // You can add other methods for ThirdPartyController here as needed
};


module.exports = AccessTokenController
