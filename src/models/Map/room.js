const mongoose = require("mongoose");
const Building = require("./building");

const roomSchema = new mongoose.Schema({
    room_name: {
        type: String,
        required: true
    },
    building_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Building'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

roomSchema.pre('save', async function(next) {
    const buildingExists = await Building.exists({ _id: this.building_id });

    if (!buildingExists) {
        const err = new Error('Invalid building_id provided.');
        return next(err);
    }
    next();
});

module.exports = mongoose.model('Room', roomSchema);
