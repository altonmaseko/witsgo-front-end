const Preferences = require("../../models/UserRoutes/Preferences");


const PreferencesController = {
    async exist(query){
        try {
            const doc = await Preferences.exists(query);
            return doc !== null; // Returns true if a document exists, otherwise false
        } catch (error) {
            console.error("Error checking if document exists:", error);
            return false;
        }
    },

    //updates preferenece, or adds if not there already
    async editPreference(obj){
        try {
            const doc = await Preferences.findOneAndReplace(
                { 
                    user_id: obj.user_id,
                    preference_type: obj.preference_type,

                 },
                {
                    user_id : obj.user_id,
                    preferences_type:obj.preference_type,
                    preferences_value:obj.preferences_value,
                    updated_at: Date()
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

    }
}

module.exports = PreferencesController