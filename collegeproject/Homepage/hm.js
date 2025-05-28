let btn = document.querySelector("#btn");
let content = document.querySelector("#content");
let voice = document.querySelector("#voice");

// Personal memory store with context handling
let memory = {
  facts: [],
  userName: null,
};

// Speech Synthesis with flexible language and improved speaking queue handling
function speak(text, lang = "hi-IN") {
  if (!text) return;

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel(); // Cancel current speech before speaking new
  }

  let utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;
  utterance.lang = lang;
  window.speechSynthesis.speak(utterance);
}

// Greeting based on time with user personalization
function wishMe() {
  let hours = new Date().getHours();

  if (memory.userName) {
    if (hours < 12) speak(`Good Morning, ${memory.userName}`);
    else if (hours < 16) speak(`Good Afternoon, ${memory.userName}`);
    else speak(`Good Evening, ${memory.userName}`);
  } else {
    if (hours < 12) speak("Good Morning Sir");
    else if (hours < 16) speak("Good Afternoon Sir");
    else speak("Good Evening Sir");
  }
}

window.addEventListener("load", wishMe);

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.onresult = (event) => {
  let transcript = event.results[event.resultIndex][0].transcript.trim();
  content.innerText = transcript;
  takeCommand(transcript.toLowerCase());
};

recognition.onerror = () => {
  speak("Sorry, I didn't catch that. Please try again.");
  toggleUI(true);
};

btn.addEventListener("click", () => {
  recognition.start();
  toggleUI(false);
});

function toggleUI(listening) {
  voice.style.display = listening ? "none" : "block";
  btn.style.display = listening ? "flex" : "none";
}

// Main command processor with better parsing, memory, and fallback
async function takeCommand(message) {
  toggleUI(true);

  // Handle user name remembering and greeting personalization
  if (message.startsWith("my name is ")) {
    let name = message.replace("my name is ", "").trim();
    memory.userName = capitalize(name);
    speak(`Nice to meet you, ${memory.userName}`);
    return;
  }

  if (message.includes("what is my name") || message.includes("who am i")) {
    if (memory.userName) {
      speak(`You told me your name is ${memory.userName}`);
    } else {
      speak("I don't know your name yet. Please tell me by saying, 'My name is ...'");
    }
    return;
  }

  // Core commands
  if (/hello|hey|hi/.test(message)) {
    speak(`Yes sir, how can I help you?`);
  } else if (message.includes("who are you") || message.includes("who created you") || message.includes("who has created you")) {
    speak("I am your virtual assistant, created by Aaqib Sir.");
  }  else if (message.includes("what is your name") || message.includes("tell me your name")) {
    speak("my name is YoVa.");
  }
  
  
  else if (/open (youtube|google|facebook|instagram|whatsapp)/.test(message)) {
    let site = message.match(/open (youtube|google|facebook|instagram|whatsapp)/)[1];
    speak(`Opening ${capitalize(site)}...`);
    let urlMap = {
      youtube: "https://youtube.com/",
      google: "https://google.com/",
      facebook: "https://facebook.com/",
      instagram: "https://instagram.com/",
      whatsapp: "https://web.whatsapp.com/",
    };
    window.open(urlMap[site], "_blank");
  } else if (message.includes("time")) {
    let time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    speak(`The time is ${time}`);
  } else if (message.includes("date")) {
    let date = new Date().toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
    speak(`Today's date is ${date}`);
  }

  // Weather
  else if (message.includes("weather")) {
    let city = extractCityFromMessage(message);
    if (city) {
      speak(`Fetching weather for ${capitalize(city)}`);
      await getWeather(city);
    } else {
      speak("Please specify a city to get the weather.");
    }
  }

  // Reminders with more flexible parsing
  else if (message.includes("set reminder")) {
    handleReminder(message);
  }

  // Jokes
  else if (message.includes("tell me a joke") || message.includes("joke")) {
    tellJoke();
  }

  // News
  else if (message.includes("news")) {
    speak("Fetching the latest news headlines.");
    getNews();
  }

  // Stop speech
  else if (message.includes("stop speaking")) {
    stopSpeaking();
  }

  // Language change with feedback and flexible options
  else if (message.includes("change language to")) {
    let lang = message.split("change language to ")[1].trim();
    changeLanguage(lang);
  }

  // Wikipedia queries
  else if (message.match(/who is|what is|wikipedia/)) {
    let query = message.replace(/who is|what is|wikipedia/g, "").trim();
    getWikipedia(query);
  }

  // YouTube Search & Play
  else if (message.includes("play") && message.includes("on youtube")) {
    let query = message.split("play")[1].split("on youtube")[0].trim();
    speak(`Playing ${query} on YouTube.`);
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, "_blank");
  }

  // Remember facts with multiple facts storage
  else if (message.includes("remember that")) {
    let fact = message.split("remember that")[1].trim();
    if (fact) {
      memory.facts.push(fact);
      speak("Okay, I will remember that.");
    } else {
      speak("Please tell me what to remember after saying 'remember that'");
    }
  } else if (message.includes("what did you remember") || message.includes("do you remember")) {
    if (memory.facts.length > 0) {
      speak("Here is what you asked me to remember:");
      memory.facts.forEach((fact, i) => {
        speak(`${i + 1}: ${fact}`);
      });
    } else {
      speak("You haven't asked me to remember anything yet.");
    }
  }

  // Translation
  else if (message.includes("translate")) {
    let match = message.match(/translate (.+) to (.+)/i);
    if (match) {
      let [, word, lang] = match;
      translateText(word.trim(), lang.trim());
    } else {
      speak("Please say 'translate [word] to [language]'");
    }
  }

  // Smart home simulation
  else if (message.includes("turn on") || message.includes("turn off")) {
    let device = message.replace("turn on", "").replace("turn off", "").trim();
    let state = message.includes("turn on") ? "on" : "off";
    speak(`Okay, turning ${state} the ${device}`);
  }

  // Location services
  else if (message.includes("where am i")) {
    getLocation();
  }

  // Navigation
  else if (message.includes("navigate to")) {
    let place = message.split("navigate to ")[1];
    if (place) {
      speak(`Navigating to ${place}`);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place)}`, "_blank");
    }
  }

  // Help command
  else if (message.includes("help")) {
    help();
  }

  // Default fallback to web search
  else {
    speak(`I am searching the web for ${message}`);
    window.open(`https://www.google.com/search?q=${encodeURIComponent(message)}`, "_blank");
  }
}

// Utility: Capitalize first letter
function capitalize(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Extract city from message for weather queries more flexibly
function extractCityFromMessage(message) {
  let cityMatch = message.match(/weather in ([a-z\s]+)/i);
  if (cityMatch && cityMatch[1]) {
    return cityMatch[1].trim();
  }
  return null;
}

// Reminder handler improved for flexible commands
function handleReminder(message) {
  // Try to parse "set reminder at 6:30 pm to call mom"
  let timeMatch = message.match(/set reminder (at|for) ([\d:apm\s]+) to (.+)/i);

  if (!timeMatch) {
    speak("Please say: set reminder at [time] to [task]");
    return;
  }

  let time = timeMatch[2].trim();
  let task = timeMatch[3].trim();

  // Parse time into Date object
  let now = new Date();
  let reminderTime = new Date(`${now.toDateString()} ${time}`);

  if (isNaN(reminderTime.getTime())) {
    speak("The time you specified is invalid.");
    return;
  }

  if (reminderTime < now) {
    speak("That time has already passed.");
    return;
  }

  let delay = reminderTime.getTime() - now.getTime();

  setTimeout(() => speak(`Reminder: ${task}`), delay);

  speak(`Reminder set for ${time} to ${task}`);
}

// Tell random joke
function tellJoke() {
  const jokes = [
    "Why don't scientists trust atoms? Because they make up everything!",
    "Why did the scarecrow win an award? Because he was outstanding in his field!",
    "Why don't skeletons fight each other? They don't have the guts.",
    "What do you call fake spaghetti? An impasta!",
    "Why did the math book look sad? Because it had too many problems.",
  ];
  speak(jokes[Math.floor(Math.random() * jokes.length)]);
}

// Fetch latest news with a slight delay to avoid overlapping speech
async function getNews() {
  try {
    const res = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&apiKey=d906b48a39ef4b2b88eb863fdee20cb2`
    );
    const data = await res.json();
    if (!data.articles || data.articles.length === 0) {
      speak("No news available now.");
      return;
    }

    // Speak headlines one by one with delay
    for (let i = 0; i < Math.min(5, data.articles.length); i++) {
      speak(`Headline ${i + 1}: ${data.articles[i].title}`);
      await delay(2500); // Wait 2.5 sec between headlines for clarity
    }
  } catch {
    speak("Failed to fetch news.");
  }
}

// Helper delay function to pause speech
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Stop speech immediately
function stopSpeaking() {
  window.speechSynthesis.cancel();
}

// Change assistant language with a friendly confirmation
function changeLanguage(lang) {
  const languageMap = {
    english: "en-US",
    hindi: "hi-IN",
    spanish: "es-ES",
    french: "fr-FR",
    german: "de-DE",
    chinese: "zh-CN",
    japanese: "ja-JP",
    russian: "ru-RU",
  };

  let langCode = languageMap[lang.toLowerCase()] || "en-US";
  speak(`Changing language to ${capitalize(lang)}`, langCode);
}

// Help command listing all available commands clearly
function help() {
  const commands = [
    "Say 'hello', 'hey', or 'hi' to greet me.",
    "Say 'open YouTube', 'Google', 'Facebook', 'Instagram', or 'WhatsApp'.",
    "Ask 'what's the time' or 'date'.",
    "Say 'tell me a joke' or 'news'.",
    "Say 'stop speaking' to stop me.",
    "Say 'change language to [language]' to switch languages.",
    "Say 'set reminder at [time] to [task]'.",
    "Say 'weather in [city]' to get weather updates.",
    "Ask 'who is [name]' or 'what is [topic]' for Wikipedia info.",
    "Say 'translate [word] to [language]'.",
    "Say 'remember that [fact]' to save something.",
    "Ask 'what did you remember' to recall facts.",
    "Say 'navigate to [place]'.",
    "Say 'turn on [device]' or 'turn off [device]'.",
    "Ask 'where am I' to get your location.",
    "Say 'help' to hear these commands again."
  ];
  speak("Here are some things you can ask me:");
  commands.forEach((cmd) => speak(cmd));
}

// Wikipedia summary fetcher with fallback
async function getWikipedia(query) {
  if (!query) {
    speak("Please specify what you want to know from Wikipedia.");
    return;
  }

  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
    );
    const data = await res.json();

    if (data.extract) {
      speak(data.extract);
    } else {
      speak("No information found on Wikipedia for your query.");
    }
  } catch {
    speak("Unable to fetch information from Wikipedia.");
  }
}

// Translate text using MyMemory API with error handling
async function translateText(text, targetLang) {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`
    );
    const data = await res.json();

    let translated = data.responseData.translatedText;

    if (translated) {
      speak(`The translation is: ${translated}`, targetLang);
    } else {
      speak("I couldn't find the translation.");
    }
  } catch {
    speak("Translation failed.");
  }
}

// Get user's location and open Google Maps
function getLocation() {
  if (!navigator.geolocation) {
    speak("Geolocation is not supported by your browser.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      let lat = position.coords.latitude;
      let lon = position.coords.longitude;
      speak(`You are located at latitude ${lat.toFixed(2)} and longitude ${lon.toFixed(2)}`);
      window.open(`https://www.google.com/maps?q=${lat},${lon}`, "_blank");
    },
    () => speak("Unable to retrieve your location.")
  );
}
