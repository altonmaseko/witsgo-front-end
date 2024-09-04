/**
 * Represents real-time tracking data for a vehicle.
 * @class Tracking
 * @property {String} vehicle_id - The ID of the vehicle.
 * @property {String} route_id - The ID of the route the vehicle is on.
 * @property {String} current_stop_id - The ID of the current stop the vehicle is at.
 * @property {Date} timestamp - The timestamp of the tracking data.
 * @property {Number} latitude - The latitude of the vehicle's current location.
 * @property {Number} longitude - The longitude of the vehicle's current location.
 */
const mongoose = require('mongoose');

const TrackingSchema = new mongoose.Schema({
    vehicle_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    route_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },
    current_stop_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stop',
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Tracking', TrackingSchema);
