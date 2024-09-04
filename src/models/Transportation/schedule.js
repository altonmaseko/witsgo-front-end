/**
 * Represents a transportation schedule.
 * @class Schedule
 * @property {String} route_id - The ID of the route.
 * @property {String} stop_id - The ID of the stop.
 * @property {Date} arrival_time - The expected arrival time of the vehicle.
 * @property {Date} departure_time - The expected departure time of the vehicle.
 */
const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
    route_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },
    stop_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stop',
        required: true
    },
    arrival_time: {
        type: Date,
        required: true
    },
    departure_time: {
        type: Date,
        required: true
    }
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
