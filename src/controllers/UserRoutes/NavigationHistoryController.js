const NavigationHistory = require("../../models/UserRoutes/NavigationHistory");


const NavigationHistoryController = {
    async exists(query){
        try {
            const doc = await NavigationHistory.exists(query);
            return doc !== null; // Returns true if a document exists, otherwise false
        } catch (error) {
            console.error("Error checking if document exists:", error);
            return false;
        }
    },

    async addRecord(recordInfo){
        try{
            const alreadyExists = this.getRecord({route_id:recordInfo.route_id});

            if (alreadyExists){
                return { success: false, message: "document_already_exists" };
            }

            const doc = new NavigationHistory(recordInfo);
            const savedDoc = await doc.save();

            return { success: true, data: savedDoc };

        }catch(error){
            return { success: false, message: error.message};
        }
    }
}


module.exports = NavigationHistoryController;