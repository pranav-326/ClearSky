import express from "express"
import bodyParser from "body-parser"
import axios from "axios"
import dotenv from "dotenv";
const app=express()
const port=process.env.PORT || 8080
var lat, lon
dotenv.config()
const WeatherKey=process.env.WEATHER_API
const OpenUVKey=process.env.OPENUV_API
app.use(express.static("public"));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.post("/save-location", (req, res) => {
    lat = req.body.lat;
    lon = req.body.lon;
    console.log("Through geolocation")
    res.send({ message: "Location saved" });
});
var d = new Date(); 

app.get("/", async (req,res)=>{
    if (lat==null&&lon==null) {
        await getLocation()
    }  
    console.log(`(${lat},${lon})`)
    const result = await axios.get(`https://api.weatherapi.com/v1/current.json?q=${lat},${lon}&key=${WeatherKey}`);
    const iconUrl = result.data.current.condition.icon;
    const windDirection=Math.round(result.data.current.wind_degree/10)*10
    const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    const date=d.getDate()
    var suffix
    if (date===1) {
        suffix="st"
    }
    else if(date===2) {
        suffix="nd"
    }
    else if (date===3) {
        suffix="rd"
    }
    else {
        suffix="th"
    }
    const arr=[Math.round(result.data.current.feelslike_c),result.data.current.humidity,result.data.current.vis_km]
    res.render("index.ejs",{"content":result.data.current.condition.text,"imageURL":iconUrl,"hours":d.getHours(),"temp":Math.round(result.data.current.temp_c),"data":arr,"windDirection":windDirection,"windSpeed":result.data.current.wind_kph,"month":months[d.getMonth()],"day":days[d.getDay()],"date":d.getDate(),"suffix":suffix,"year":d.getFullYear()})
})
app.get("/uv-data", async (req, res) => {
    try {
        if (lat == null && lon == null) {
            await getLocation();
        }  
        const result = await axios.get(`https://api.openuv.io/api/v1/uv?lat=${lat}&lng=${lon}&alt=100`, {
            headers: {
                "x-access-token": OpenUVKey
            }
        });

        const d = new Date(result.data.result.uv_max_time);
        const currentHour = new Date().getHours(); 

        res.render("index1.ejs", { 
            uvInd: Math.round(result.data.result.uv * 10) / 10,
            uvMax: Math.round(result.data.result.uv_max * 10) / 10,
            uvMaxTime: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
            hours: currentHour,
            expTime: null
        });
    } catch (error) {
        console.error("Error fetching UV data:", error.response?.data || error.message);
        res.status(500).send("Error retrieving UV data.");
    }
});

app.post("/uv-data/submit", async (req, res) => {
    try {
        if (!req.body.skinType) {
            return res.status(400).send("Skin type is required.");
        }

        const skinType = parseInt(req.body.skinType);
        if (skinType < 1 || skinType > 6) {
            return res.status(400).send("Invalid skin type.");
        }

        const result = await axios.get(`https://api.openuv.io/api/v1/uv?lat=${lat}&lng=${lon}&alt=100`, {
            headers: {
                "x-access-token": OpenUVKey
            }
        });
        const exposureTime = result.data.result.safe_exposure_time[`st${skinType}`];
        const d = new Date(result.data.result.uv_max_time);
        const currentHour = new Date().getHours();
        console.log(result.data)
        console.log(exposureTime)
        res.render("index1.ejs", { 
            uvInd: Math.round(result.data.result.uv * 10) / 10,
            uvMax: Math.round(result.data.result.uv_max * 10) / 10,
            uvMaxTime: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
            hours: currentHour,
            expTime: exposureTime
        });
    } catch (error) {
        console.error("Error calculating exposure time:", error.response?.data || error.message);
        res.status(500).send("Error calculating safe exposure time.");
    }
});

app.listen(port, () => {
    console.log(`Running on port ${port}`);
});

async function getLocation() {
    async function getPublicIP() {
        try {
            const response = await axios.get("https://api64.ipify.org?format=json");
            return response.data.ip;  
        } catch (error) {
            console.error("Error getting public IP:", error);
            return null;
            }
        }
        const ip = await getPublicIP();
        if (!ip) {
            console.error("Could not retrieve public IP.");
            return;
        }
    
        try {
            const result1 = await axios.get(`http://ip-api.com/json/${ip}`);
            lat = parseFloat(result1.data.lat);
            lon = parseFloat(result1.data.lon);
            console.log("Through IP")
        } catch (error) {
            console.error("Error fetching location from IP API:", error);
        }
}