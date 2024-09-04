const mongoose = require("mongoose");
const User = require("./Users");;


const preferencesSchema = new mongoose.Schema({
    preference_id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
        required: true
    },
    user_id:{
        type: mongoose.Schema.Types.ObjectId, // Reference to the User model
        required: true,
        ref: 'User' // Assuming you have a User model
    },
    preferences_type:{
        type:String,
        enum:["wheelchair","tolls_free","none"],
        required:true,
        default:"none"
    },
    preferences_value: {
        type: Boolean, // Can store various types of data
        required: true
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

preferencesSchema.pre('save', async function(next) {
    // `this` refers to the current document being saved
    const isValidUser = await User.isUserValid(this.user_id);

    if (!isValidUser) {
        const err = new Error('Invalid user_id provided.');
        return next(err);
    }
    next();
});



module.exports = mongoose.model('Preferences', preferencesSchema);
