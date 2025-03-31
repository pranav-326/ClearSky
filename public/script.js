async function sendLocationToServer() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            await fetch("/save-location", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ lat: latitude, lon: longitude })
            });
        }, (error) => {
            console.error("Geolocation error:", error);
        }, {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0
        });
    } else {
        console.log("Geolocation is not supported in this browser.");
    }
}
sendLocationToServer();