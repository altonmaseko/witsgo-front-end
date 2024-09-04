/**
 * Represents a vehicle in the transportation system.
 * @class Vehicle
 * @property {String} vehicle_number - The number of the vehicle.
 * @property {String} vehicle_type - The type of the vehicle (e.g., bus, shuttle).
 */

const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
    vehicle_number: {
        type: String,
        required: true
    },
    vehicle_type: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Vehicle', VehicleSchema);
