console.log("JS is connected");

/* =========================
   STATE SYSTEM
========================= */

const STATES = {
    IDLE: "IDLE",
    PRECHECK: "PRECHECK",
    COUNTDOWN: "COUNTDOWN",
    ASCENT: "ASCENT",
    SPACE: "SPACE",
    ABORT: "ABORT"
};



const missionPlan = [
    { name: "ISS", fuel: 15000 }
];

let missionState = STATES.IDLE;
let telemetryInterval = null;

let timeouts = [];

/* =========================
   TELEMETRY
========================= */

let telemetry = {
    altitude: 0,
    velocity: 0,
    fuel: 100
};

let isRunning = false;
let functionOne = true;
let functionTwo = true;
let functionThree = true;



/* =========================
   MAIN LAUNCH
========================= */

async function launchMission() {

    if (missionState !== STATES.IDLE) {
        console.log("Mission blocked — state =", missionState);
        return;
    }

    if (isRunning) return;
    isRunning = true;

    if (!isRunning) {
      return; 
    }

    await new Promise(resolve => setTimeout(resolve, 50));
    
    missionState = STATES.PRECHECK;

    /* ---------- ELEMENTS (SAFE) ---------- */
    const rocket = document.getElementById("rocket");
    const consoleBox = document.getElementById("console");
    const output = document.getElementById("ready");
    const telemetryBox = document.getElementById("telemetry");
    const flame = document.querySelector(".rocket-flame");

    /* ---------- RESET UI ---------- */
    consoleBox.innerHTML = "";
    output.textContent = "";

    rocket.style.transform = "translateX(-50%)translateY(0)";
    if (flame) flame.style.opacity = "0";

    /* ---------- INPUTS ---------- */
    let fuelInput = document.getElementById("fuel")?.value || "";
    let fuel = fuelInput === "" ? 50000 : Number(fuelInput);
    let reasons = [];
    
    const ship = document.getElementById("ship")?.value || "capsule";
    const crew = Number(document.getElementById("crew")?.value || 0);
    const cargo = Number(document.getElementById("weight")?.value || 0);

    /* ---------- PHYSICS ---------- */
    if (ship === "cargo") fuel -= 100000;
    else if (ship === "explorer") fuel -= 50000;
    else fuel -= 75000;

    fuel -= crew * 800;
    fuel -= cargo * 2;

    const mass = crew * 100;

    /* ---------- DESTINATION ---------- */
    let requiredFuel = 400000;

    /* ---------- WEATHER ---------- */
    const weather = ["Clear", "Cloudy", "Stormy", "Solar Activity"][
        Math.floor(Math.random() * 4)
    ];

    let margin = fuel - requiredFuel;

    if (fuel < requiredFuel) {
        reasons.push("Too little fuel");
    }

    if (weather === "Stormy") {
        margin -= 10000
        reasons.push(weather);
    };
    
    if (weather === "Solar Activity") {
        margin -= 20000;
        reasons.push(weather);
    };

    let risk = margin > 20000 ? 5 : margin > 5000 ? 20 : 60;
    if (mass > 1000) risk += 25;

    /* ---------- ABORT ---------- */
    if (risk > 85) {
        missionState = STATES.ABORT;
        consoleBox.innerHTML = "🚫 ABORT: SYSTEM FAILURE";
        alert("MISSION ABORTED DUE TO HIGH RISK")
        output.textContent = "MISSION ABORTED";
        return;
    }

    /* ---------- APPROVAL ---------- */
    let launchApproved =
        fuel >= requiredFuel &&
        weather !== "Stormy" &&
        weather !== "Solar Activity" &&
        risk <= 85;



    /* ---------- PRECHECK ---------- */
    consoleBox.innerHTML += `[WEATHER] ${weather}<br>`;

    const checks = [
        "✔ SYSTEMS ONLINE",
        "✔ GUIDANCE READY",
        "✔ TRAJECTORY LOCKED",
        "✔ FLIGHT COMPUTER SYNC",
        "✔ RANGE SAFETY CLEARED"
    ];

    checks.forEach((text, i) => {
        timeouts.push(setTimeout(() => {
            consoleBox.innerHTML += text + "<br>";
        }, i * 900));
    });

    if (isRunning && functionOne) {
        timeouts.push(setTimeout(() => {
            startCountdown(launchApproved, rocket, output, consoleBox, flame, risk, reasons);
        }, checks.length * 900 + 500));
    }

    /* ---------- TELEMETRY RESET ---------- */
    if (telemetryInterval) clearInterval(telemetryInterval);

    telemetry = { altitude: 0, velocity: 0, fuel: 100 };

    telemetryInterval = setInterval(() => {

        if (missionState === STATES.ASCENT || missionState === STATES.SPACE) {

            telemetry.velocity += 0.8;
            telemetry.altitude += telemetry.velocity * 0.5;
            telemetry.fuel = Math.max(0, telemetry.fuel - 0.3);

            if (telemetryBox) {
                telemetryBox.innerHTML =
                    `ALTITUDE: ${telemetry.altitude.toFixed(0)} km<br>` +
                    `VELOCITY: ${telemetry.velocity.toFixed(2)} km/s<br>` +
                    `FUEL: ${telemetry.fuel.toFixed(0)}%`;
            }

            if (telemetry.fuel <= 0) {
                telemetry.fuel = 0;
                clearInterval(telemetryInterval);
                telemetryInterval = null;
                missionState = STATES.IDLE;
                console.log("Mission complete");
                document.body.classList.remove("space");
        }
    }

    }, 100);

}



/* =========================
   COUNTDOWN
========================= */

function startCountdown(approved, rocket, output, consoleBox, flame, risk, reasons) {

    missionState = STATES.COUNTDOWN;

    let count = 6;

    const interval = setInterval(() => {

        output.textContent = `T-${count}`;

        if (count === 3) consoleBox.innerHTML += "FINAL CHECKS<br>";
        if (count === 2) consoleBox.innerHTML += "ENGINE START<br>";
        if (count === 1) consoleBox.innerHTML += "IGNITION<br>";

        if (count === 0) {
            clearInterval(interval);

            if (approved && isRunning && functionTwo) {
                startLaunch(rocket, output, flame, risk);
            } else {
                output.className = "fail";
                missionState = STATES.IDLE;
                alert("MISSION FAILURE: " + reasons.join(", "))
            }
        }

        count--;

    }, 900);
}

/* =========================
   LAUNCH
========================= */

function startLaunch(rocket, output, flame, risk) {

    document.getElementById("launchArea")
        .scrollIntoView({ behavior: "smooth", block: "center" });

    missionState = STATES.ASCENT;

    document.body.classList.add("space");

    // flame
    if (flame) {
        flame.style.opacity = "1";
        timeouts.push(setTimeout(() => flame.style.opacity = "0.5", 1500));
        timeouts.push(setTimeout(() => flame.style.opacity = "0", 4000));
    }

    // rocket animation
    rocket.style.transition = "transform 2s ease-out";
    rocket.style.transform = "translateX(-50%) translateY(-20px)";

    timeouts.push(setTimeout(() => {
        rocket.style.transition = "transform 3s ease-in";
        rocket.style.transform = "translateX(-50%) translateY(-500px)";
    }, 2000));

    timeouts.push(setTimeout(() => {
        rocket.style.transition = "transform 8s ease-in";
        rocket.style.transform = "translateX(-50%) translateY(-2500px) scale(2.5)";
        missionState = STATES.SPACE;
    }, 5000));

    //  FINAL RESULT
    timeouts.push(setTimeout(() => {



        
        const ready = document.getElementById("ready");
        if (ready) {
            ready.textContent = "MISSION SUCCESS";
            
            missionState = STATES.SPACE;
            
            
        }
        isRunning = false;

     

        

    
    }, 11000));

    



}

function resetMission() {
    
    missionState = STATES.IDLE;
    isRunning = false;

    clearInterval(telemetryInterval);
    telemetryInterval = null;

    telemetry = { altitude: 0, velocity: 0, fuel: 100 };

    document.body.classList.remove("space");

    const rocket = document.getElementById("rocket");
    const flame = document.querySelector(".rocket-flame");

    rocket.style.transition = "none";
    rocket.style.transform = "translateX(-50%) translateY(0)";

    if (flame) {
        flame.style.opacity = "0";
    }

    document.getElementById("console").innerHTML = "";
    document.getElementById("ready").textContent = "";
    document.getElementById("telemetry").innerHTML = "";

    timeouts.forEach(clearTimeout);
    timeouts = [];

}
