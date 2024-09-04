const mongoose = require("mongoose");
const User = require("./Users");;



const routesSchema = new mongoose.Schema({
    route_id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the User model
        required: true,
        ref: 'User' // Assuming you have a User model
    },
    start_location: {
        type: Map, // Use Map to store key-value pairs (or you can use an embedded schema)
        of: String, // Assuming location data are key-value pairs like { "lat": "value", "lng": "value" }
        required: true
    },
    end_location: {
        type: Map, // Same as above
        of: String,
        required: true
    },
    duration: {
        type: Number, // Correct type for integers
        required: true
    },
    route_data: {
        type: String, // Encoded polyline as a string
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now, // Automatically set to the current date and time if not provided
        required: true
    }
});

routesSchema.pre('save', async function(next) {
    // `this` refers to the current document being saved
    const isValidUser = await User.isUserValid(this.user_id);

    if (!isValidUser) {
        const err = new Error('Invalid user_id provided.');
        return next(err);
    }
    next();
});


routesSchema.statics.isRouteValid = async function(route_id) {
    try {
        const route = await this.exists({ _id: route_id });
        return route !== null;
    } catch (error) {
        console.error("Error checking if route is valid:", error);
        return false;
    }
};


module.exports = mongoose.model('Routes', routesSchema);
