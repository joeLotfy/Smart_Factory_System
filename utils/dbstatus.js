const mongoose = require('mongoose');

function getDBStatus() {
    const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting...",
        3: "disconnecting..."
    };

    return{
        status: states[mongoose.connection.readyState],
        readyState: mongoose.connection.readyState,
    };
}


module.exports = getDBStatus;