/* =========================================================
   EARTHQUEST AI
   Local-first outdoor adventure application
   ========================================================= */


/* =========================
   CONFIGURATION
========================= */

const OLLAMA_URL = "http://localhost:11434";

const MODEL_NAME = "llama3.2";


/* =========================
   APPLICATION STATE
========================= */

const state = {

    selectedTime: 15,

    selectedActivity: "nature exploration",

    selectedFeeling: null,

    currentQuest: null,

    timer: null,

    remainingSeconds: 0,

    questStartedAt: null

};


/* =========================
   DOM ELEMENTS
========================= */

const elements = {

    questBuilder:
        document.getElementById("questBuilder"),

    generateButton:
        document.getElementById("generateButton"),

    randomQuestButton:
        document.getElementById("randomQuestButton"),

    startCreatingButton:
        document.getElementById("startCreatingButton"),

    questResult:
        document.getElementById("questResult"),

    activeQuest:
        document.getElementById("activeQuest"),

    completionSection:
        document.getElementById("completionSection"),

    startQuestButton:
        document.getElementById("startQuestButton"),

    finishQuestButton:
        document.getElementById("finishQuestButton"),

    completeButton:
        document.getElementById("completeButton"),

    regenerateButton:
        document.getElementById("regenerateButton"),

    closeQuestButton:
        document.getElementById("closeQuestButton"),

    timer:
        document.getElementById("timer"),

    timerProgress:
        document.getElementById("timerProgress"),

    questTitle:
        document.getElementById("questTitle"),

    questSubtitle:
        document.getElementById("questSubtitle"),

    questIcon:
        document.getElementById("questIcon"),

    questDuration:
        document.getElementById("questDuration"),

    questActivity:
        document.getElementById("questActivity"),

    aiMessage:
        document.getElementById("aiMessage"),

    objectiveList:
        document.getElementById("objectiveList"),

    locationInput:
        document.getElementById("locationInput"),

    reflectionInput:
        document.getElementById("reflectionInput"),

    toast:
        document.getElementById("toast"),

    toastMessage:
        document.getElementById("toastMessage"),

    questCount:
        document.getElementById("questCount"),

    outsideMinutes:
        document.getElementById("outsideMinutes"),

    currentStreak:
        document.getElementById("currentStreak"),

    dashboardMinutes:
        document.getElementById("dashboardMinutes"),

    dashboardQuests:
        document.getElementById("dashboardQuests"),

    dashboardStreak:
        document.getElementById("dashboardStreak"),

    dashboardLevel:
        document.getElementById("dashboardLevel"),

    ollamaStatus:
        document.getElementById("ollamaStatus"),

    statusText:
        document.getElementById("statusText"),

    themeButton:
        document.getElementById("themeButton")

};


/* =========================
   LOCAL STORAGE
========================= */

const STORAGE_KEY = "earthquest_data";


function getStats() {

    const defaultStats = {

        quests: 0,

        minutes: 0,

        streak: 0,

        lastQuestDate: null

    };

    const stored =
        localStorage.getItem(STORAGE_KEY);

    if (!stored) {
        return defaultStats;
    }

    try {

        return {
            ...defaultStats,
            ...JSON.parse(stored)
        };

    } catch {

        return defaultStats;

    }

}


function saveStats(stats) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(stats)
    );

}


function updateDashboard() {

    const stats = getStats();

    elements.questCount.textContent =
        stats.quests;

    elements.outsideMinutes.textContent =
        stats.minutes;

    elements.currentStreak.textContent =
        stats.streak;

    elements.dashboardMinutes.textContent =
        stats.minutes;

    elements.dashboardQuests.textContent =
        stats.quests;

    elements.dashboardStreak.textContent =
        stats.streak;

    elements.dashboardLevel.textContent =
        calculateLevel(stats.quests);

}


function calculateLevel(quests) {

    if (quests >= 30) {
        return "Trailblazer";
    }

    if (quests >= 15) {
        return "Explorer";
    }

    if (quests >= 7) {
        return "Pathfinder";
    }

    if (quests >= 3) {
        return "Wanderer";
    }

    return "Beginner";

}


/* =========================
   TOAST
========================= */

let toastTimeout;


function showToast(message) {

    elements.toastMessage.textContent =
        message;

    elements.toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {

        elements.toast.classList.remove("show");

    }, 3000);

}


/* =========================
   CHOICE BUTTONS
========================= */

document
    .querySelectorAll(".choice-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".choice-button")
                    .forEach(item =>
                        item.classList.remove("active")
                    );

                button.classList.add("active");

                state.selectedTime =
                    Number(button.dataset.time);

            }
        );

    });


document
    .querySelectorAll(".activity-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".activity-button")
                    .forEach(item =>
                        item.classList.remove("active")
                    );

                button.classList.add("active");

                state.selectedActivity =
                    button.dataset.activity;

            }
        );

    });


/* =========================
   FEELING BUTTONS
========================= */

document
    .querySelectorAll(".experience-options button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".experience-options button"
                    )
                    .forEach(item =>
                        item.classList.remove("active")
                    );

                button.classList.add("active");

                state.selectedFeeling =
                    button.dataset.feeling;

            }
        );

    });


/* =========================
   OLLAMA CONNECTION
========================= */

async function checkOllama() {

    try {

        const response =
            await fetch(OLLAMA_URL, {
                method: "GET"
            });

        if (response.ok) {

            elements.ollamaStatus
                .classList.add("online");

            elements.statusText.textContent =
                "Ollama connected";

            return true;

        }

    } catch (error) {

        console.log(
            "Ollama unavailable."
        );

    }

    elements.statusText.textContent =
        "Local AI offline";

    return false;

}


/* =========================
   GENERATE QUEST
========================= */

async function generateQuest() {

    const location =
        elements.locationInput.value.trim();

    elements.generateButton.disabled = true;

    elements.generateButton.innerHTML =
        `<span>✦</span> Creating your adventure...`;

    try {

        const ollamaAvailable =
            await checkOllama();

        let quest;

        if (ollamaAvailable) {

            quest =
                await generateWithOllama(location);

        } else {

            quest =
                generateFallbackQuest(location);

            showToast(
                "Ollama isn't running — using local demo mode."
            );

        }

        state.currentQuest = quest;

        displayQuest(quest);

    } catch (error) {

        console.error(error);

        state.currentQuest =
            generateFallbackQuest(location);

        displayQuest(
            state.currentQuest
        );

        showToast(
            "AI unavailable. Created a fallback quest."
        );

    } finally {

        elements.generateButton.disabled =
            false;

        elements.generateButton.innerHTML =
            `<span>✦</span>
             Generate My Quest
             <span>→</span>`;

    }

}


/* =========================
   OLLAMA AI GENERATION
========================= */

async function generateWithOllama(location) {

    const prompt = `
You are EarthQuest AI, an outdoor adventure designer.

Create a safe, simple, fun outdoor quest.

User preferences:
Duration: ${state.selectedTime} minutes
Activity: ${state.selectedActivity}
Location: ${location || "not specified"}

Important principles:
- Get the person away from their screen.
- Keep the phone use minimal.
- Do not require expensive equipment.
- Do not recommend dangerous activities.
- Make the quest realistic for the available time.
- Encourage observation and movement.
- Do not give medical advice.

Return ONLY valid JSON using this exact structure:

{
  "title": "short quest title",
  "subtitle": "one sentence description",
  "icon": "one emoji",
  "message": "2-4 sentence motivational mission briefing",
  "objectives": [
    "objective 1",
    "objective 2",
    "objective 3",
    "objective 4"
  ]
}
`;

    const response =
        await fetch(
            `${OLLAMA_URL}/api/generate`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    model: MODEL_NAME,

                    prompt: prompt,

                    stream: false,

                    format: "json"

                })

            }
        );

    if (!response.ok) {

        throw new Error(
            "Ollama request failed"
        );

    }

    const data =
        await response.json();

    let parsed;

    try {

        parsed =
            JSON.parse(data.response);

    } catch {

        throw new Error(
            "Invalid AI response"
        );

    }

    return {

        ...parsed,

        duration:
            state.selectedTime,

        activity:
            state.selectedActivity

    };

}


/* =========================
   FALLBACK QUEST GENERATOR
========================= */

function generateFallbackQuest(location) {

    const quests = {

        "nature exploration": {

            title: "The Tiny Wild Hunt",

            subtitle:
                "Slow down and discover the small details hiding around you.",

            icon: "🌿",

            message:
                "Head outside and explore at an easy pace. Leave your phone in your pocket and let curiosity decide where you go.",

            objectives: [

                "Find three different types of leaves.",

                "Notice one sound you normally ignore.",

                "Find something growing in an unexpected place.",

                "Spend at least 10 minutes simply observing."

            ]

        },

        "walking": {

            title: "The Unknown Path",

            subtitle:
                "Take a familiar walk and look at it differently.",

            icon: "🚶",

            message:
                "Walk somewhere safe near you. Choose one small street, path, or area you normally pass without noticing.",

            objectives: [

                "Walk continuously for at least 10 minutes.",

                "Find one interesting building or object.",

                "Notice three different sounds.",

                "Take one minute to stop and observe."

            ]

        },

        "running": {

            title: "Green Miles",

            subtitle:
                "Turn your next run into a mini exploration.",

            icon: "🏃",

            message:
                "Run or jog at a comfortable pace and use the environment around you as your guide.",

            objectives: [

                "Warm up with an easy walk.",

                "Run or jog for at least 10 minutes.",

                "Notice three things you have never noticed before.",

                "Finish with a relaxed cooldown."

            ]

        },

        "photography": {

            title: "Five Frames Outside",

            subtitle:
                "Find five moments worth remembering.",

            icon: "📸",

            message:
                "Take your camera outside, but avoid scrolling. Your mission is to find beauty rather than consume it.",

            objectives: [

                "Photograph an interesting texture.",

                "Find an unusual natural shape.",

                "Capture something moving.",

                "Take one photo of something you normally ignore."

            ]

        },

        "bird watching": {

            title: "Sky & Song",

            subtitle:
                "Use your ears before your eyes.",

            icon: "🐦",

            message:
                "Find a safe outdoor spot and become quiet. Listen carefully before trying to identify anything.",

            objectives: [

                "Listen for three different bird calls.",

                "Spot at least one bird.",

                "Notice where the birds are moving.",

                "Spend five minutes quietly observing."

            ]

        },

        "mindfulness": {

            title: "Five Senses Outside",

            subtitle:
                "A quiet reset using the world around you.",

            icon: "🧘",

            message:
                "Find a comfortable and safe outdoor place. Put the phone away and reconnect with your surroundings.",

            objectives: [

                "Notice five things you can see.",

                "Notice four things you can physically feel.",

                "Listen for three different sounds.",

                "Take ten slow, comfortable breaths."

            ]

        }

    };

    const quest =
        quests[state.selectedActivity]
        || quests["nature exploration"];

    return {

        ...quest,

        duration:
            state.selectedTime,

        activity:
            state.selectedActivity,

        location:
            location || null

    };

}


/* =========================
   DISPLAY QUEST
========================= */

function displayQuest(quest) {

    elements.questTitle.textContent =
        quest.title;

    elements.questSubtitle.textContent =
        quest.subtitle;

    elements.questIcon.textContent =
        quest.icon;

    elements.questDuration.textContent =
        `${quest.duration} MIN`;

    elements.questActivity.textContent =
        quest.activity.toUpperCase();

    elements.aiMessage.textContent =
        quest.message;

    elements.objectiveList.innerHTML = "";

    quest.objectives.forEach(
        objective => {

            const div =
                document.createElement("div");

            div.className =
                "objective";

            div.innerHTML = `
                <span class="objective-check">
                    ✓
                </span>

                <span>
                    ${escapeHTML(objective)}
                </span>
            `;

            elements.objectiveList
                .appendChild(div);

        }
    );

    elements.questResult
        .classList.remove("hidden");

    elements.questResult
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

}


/* =========================
   START QUEST
========================= */

function startQuest() {

    if (!state.currentQuest) {

        showToast(
            "Create a quest first."
        );

        return;

    }

    state.remainingSeconds =
        state.currentQuest.duration * 60;

    state.questStartedAt =
        Date.now();

    updateTimer();

    elements.activeQuest
        .classList.remove("hidden");

    document.body.style.overflow =
        "hidden";

    clearInterval(state.timer);

    state.timer =
        setInterval(() => {

            state.remainingSeconds--;

            updateTimer();

            if (
                state.remainingSeconds <= 0
            ) {

                clearInterval(state.timer);

                showToast(
                    "Quest time complete! 🌍"
                );

            }

        }, 1000);

}


/* =========================
   TIMER
========================= */

function updateTimer() {

    const minutes =
        Math.floor(
            state.remainingSeconds / 60
        );

    const seconds =
        state.remainingSeconds % 60;

    elements.timer.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    const total =
        state.currentQuest.duration * 60;

    const elapsed =
        total - state.remainingSeconds;

    const progress =
        Math.min(
            100,
            (elapsed / total) * 100
        );

    elements.timerProgress.style.width =
        `${progress}%`;

}


/* =========================
   FINISH QUEST
========================= */

function finishQuest() {

    clearInterval(state.timer);

    document.body.style.overflow =
        "";

    elements.activeQuest
        .classList.add("hidden");

    elements.completionSection
        .classList.remove("hidden");

    elements.completionSection
        .scrollIntoView({
            behavior: "smooth"
        });

}


/* =========================
   COMPLETE QUEST
========================= */

function completeQuest() {

    const stats =
        getStats();

    stats.quests++;

    stats.minutes +=
        state.currentQuest
            ? state.currentQuest.duration
            : 0;

    const today =
        new Date()
            .toISOString()
            .slice(0, 10);

    if (
        stats.lastQuestDate !== today
    ) {

        stats.streak++;

        stats.lastQuestDate =
            today;

    }

    saveStats(stats);

    updateDashboard();

    elements.completionSection
        .classList.add("hidden");

    elements.questResult
        .classList.add("hidden");

    showToast(
        `Quest complete! You earned ${calculateLevel(stats.quests)} status. 🌱`
    );

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    state.currentQuest = null;

}


/* =========================
   RANDOM QUEST
========================= */

function randomQuest() {

    const times =
        [15, 30, 60, 120];

    const activities =
        [
            "nature exploration",
            "walking",
            "running",
            "photography",
            "bird watching",
            "mindfulness"
        ];

    state.selectedTime =
        times[
        Math.floor(
            Math.random() * times.length
        )
        ];

    state.selectedActivity =
        activities[
        Math.floor(
            Math.random() * activities.length
        )
        ];

    document
        .querySelectorAll(".choice-button")
        .forEach(button => {

            button.classList.toggle(
                "active",
                Number(button.dataset.time)
                === state.selectedTime
            );

        });

    document
        .querySelectorAll(".activity-button")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.activity
                === state.selectedActivity
            );

        });

    generateQuest();

}


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value;

    return div.innerHTML;

}


/* =========================
   THEME
========================= */

let lightMode = false;


elements.themeButton.addEventListener(
    "click",
    () => {

        lightMode =
            !lightMode;

        if (lightMode) {

            document.body.style.background =
                "#edf5ed";

            document.body.style.color =
                "#102018";

            elements.themeButton.textContent =
                "☾";

            showToast(
                "Light mode enabled."
            );

        } else {

            document.body.style.background =
                "";

            document.body.style.color =
                "";

            elements.themeButton.textContent =
                "☼";

            showToast(
                "Dark mode enabled."
            );

        }

    }
);


/* =========================
   EVENT LISTENERS
========================= */

elements.generateButton
    .addEventListener(
        "click",
        generateQuest
    );


elements.randomQuestButton
    .addEventListener(
        "click",
        randomQuest
    );


elements.startCreatingButton
    .addEventListener(
        "click",
        () => {

            elements.questBuilder
                .scrollIntoView({
                    behavior: "smooth"
                });

        }
    );


elements.startQuestButton
    .addEventListener(
        "click",
        startQuest
    );


elements.finishQuestButton
    .addEventListener(
        "click",
        finishQuest
    );


elements.completeButton
    .addEventListener(
        "click",
        completeQuest
    );


elements.regenerateButton
    .addEventListener(
        "click",
        generateQuest
    );


elements.closeQuestButton
    .addEventListener(
        "click",
        () => {

            elements.questResult
                .classList.add("hidden");

        }
    );


/* =========================
   INITIALIZATION
========================= */

updateDashboard();

checkOllama();


/* =========================
   KEYBOARD SHORTCUT
========================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
            &&
            !elements.activeQuest
                .classList.contains("hidden")
        ) {

            finishQuest();

        }

    }
);