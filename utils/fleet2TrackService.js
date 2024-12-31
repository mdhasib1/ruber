const fetch = require("node-fetch");

const AUTHENTICATE_URL = "https://servicesv2.fleet2track.com/api/Fleet2Track/Authenticate";
const SMARTLOCK_URL = "https://servicesv2.fleet2track.com/api/Fleet2Track/SmartLock";

const Fleet2TrackUsername = "api@rubertogo.ch";
const Fleet2TrackPassword = "ApiRuber2024!&";
const getExtraInfo = true;


let authToken = null;
let tokenExpirationTime = null;

const authenticate = async () => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
        username: Fleet2TrackUsername,
        password: Fleet2TrackPassword,
        getExtraInfo,
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
    };

    try {
        const response = await fetch(AUTHENTICATE_URL, requestOptions);
        if (!response.ok) {
            throw new Error(`Authentication failed with status ${response.status}`);
        }
        const data = await response.json();

        authToken = data.token;
        tokenExpirationTime = new Date(data.userExpirationDate).getTime();

        console.log("Token retrieved successfully:", authToken);
        return authToken;
    } catch (error) {
        console.error("Error during authentication:", error.message);
        throw new Error("Failed to authenticate");
    }
};

const ensureToken = async () => {
    const now = Date.now();

    if (!authToken || now >= tokenExpirationTime) {
        console.log("Token expired or missing. Re-authenticating...");
        await authenticate();
    }
};


const lockUnlockVehicle = async (plate, enableLock) => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
        token: authToken,
        plate,
        enableLock,
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
    };

    try {
        const response = await fetch(SMARTLOCK_URL, requestOptions);
        if (!response.ok) {
            throw new Error(`SmartLock failed with status ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error during SmartLock operation:", error.message);
        throw new Error("Failed to lock/unlock vehicle");
    }
};

module.exports = { authenticate, ensureToken, lockUnlockVehicle };
