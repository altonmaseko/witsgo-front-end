const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
        required: true
    },
    user_name: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    }
});

// Static method to check if a user with a given ID exists
userSchema.statics.isUserValid = async function(user_id) {
    try {
        // Directly use the user_id as it is. Mongoose handles casting it to ObjectId.
        const user = await this.exists({ _id: user_id });
        return user !== null;
    } catch (error) {
        console.error("Error checking if user is valid:", error);
        return false;
    }
};

module.exports = mongoose.model('User', userSchema);
