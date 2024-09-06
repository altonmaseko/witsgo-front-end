const User = require("./../../models/UserRoutes/Users");


const UserController = {
    async exist(query){
        try {
            const doc = await User.exists(query);
            return doc !== null; // Returns true if a document exists, otherwise false
        } catch (error) {
            console.error("Error checking if document exists:", error);
            return false;
        }
    },

    async editUser(obj){
        try {
            const doc = await User.findOneAndReplace(
                { 
                    email: obj.email
                },
                {
                    user_name : obj.user_name,
                    //other attributes go here if needed
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


module.exports = UserController;