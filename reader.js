let book = null;
let rendition = null;

// Current Active Display Settings State
let currentSettings = {
  fontSize: "16px",
  lineHeight: "1.5",
  background: "#fafafa",
  color: "#000000"
};

// 1. Initializing File Loading (Using ArrayBuffer to guarantee cross-origin security)
document.getElementById('file-input').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    // Destroy lingering instances
    if(rendition) rendition.destroy();
    if(book) book.destroy();
    
    // Process raw book buffer data
    book = ePub(event.target.result);
    rendition = book.renderTo("viewer", {
      width: "100%",
      height: "100%",
      flow: "paginated",
      spread: "always"
    });

    rendition.display().then(() => {
      applyStyles();
    });

    // Auto-stop reading aloud whenever the book naturally changes pages or sections
    rendition.on("relocated", () => {
      window.speechSynthesis.cancel();
    });
  };
  reader.readAsArrayBuffer(file);
});

// 2. Navigation Control Map
document.getElementById('prev-page').addEventListener('click', () => { 
  if(rendition) rendition.prev(); 
});
document.getElementById('next-page').addEventListener('click', () => { 
  if(rendition) rendition.next(); 
});

// 3. Listening to Feature Customization Updates
document.getElementById('font-size').addEventListener('change', (e) => {
  currentSettings.fontSize = e.target.value;
  applyStyles();
});

document.getElementById('line-spacing').addEventListener('change', (e) => {
  currentSettings.lineHeight = e.target.value;
  applyStyles();
});

// Theme Customization Maps
document.getElementById('theme-light').addEventListener('click', () => {
  currentSettings.background = "#fafafa"; currentSettings.color = "#000000"; applyStyles();
});
document.getElementById('theme-dark').addEventListener('click', () => {
  currentSettings.background = "#1a1a1a"; currentSettings.color = "#ffffff"; applyStyles();
});
document.getElementById('theme-sepia').addEventListener('click', () => {
  currentSettings.background = "#f4ecd8"; currentSettings.color = "#5b4636"; applyStyles();
});

// Core Style Overwrite Hook
function applyStyles() {
  if (!rendition) return;
  document.getElementById('viewer-container').style.background = currentSettings.background;
  rendition.themes.fontSize(currentSettings.fontSize);
  rendition.themes.custom({
    "body": {
      "color": `${currentSettings.color} !important`,
      "background": `${currentSettings.background} !important`,
      "line-height": `${currentSettings.lineHeight} !important`,
      "padding": "0 40px !important"
    },
    "p": { "color": `${currentSettings.color} !important` }
  });
}

// --- ACCESSIBILITY MODULE: TEXT-TO-SPEECH ENGINE ---
let ttsUtterance = null;

function getVisibleText() {
  // Always fetch the LATEST dynamic active iframe window on the screen
  const iframe = document.querySelector("#viewer iframe");
  if (!iframe) return "";
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  if (!iframeDoc) return "";

  // Pull text from body context structures safely
  return iframeDoc.body.innerText || iframeDoc.body.textContent;
}

function speakCurrentPage() {
  // Clear lingering audio buffers entirely
  window.speechSynthesis.cancel();

  // Grabs fresh text layer elements from the active frame viewport
  const textToRead = getVisibleText();
  if (!textToRead.trim()) return;

  ttsUtterance = new SpeechSynthesisUtterance(textToRead);
  const speedSlider = document.getElementById("tts-speed");
  ttsUtterance.rate = parseFloat(speedSlider.value);

  window.speechSynthesis.speak(ttsUtterance);
}

document.getElementById("tts-play").addEventListener("click", () => {
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  } else {
    speakCurrentPage();
  }
});

document.getElementById("tts-pause").addEventListener("click", () => {
  if (window.speechSynthesis.speaking) window.speechSynthesis.pause();
});

document.getElementById("tts-speed").addEventListener("change", () => {
  if (window.speechSynthesis.speaking) speakCurrentPage();
});

// Fail-safe button handlers to silence background TTS speaker thread on manual page turns
document.getElementById('prev-page').addEventListener('click', () => { window.speechSynthesis.cancel(); });
document.getElementById('next-page').addEventListener('click', () => { window.speechSynthesis.cancel(); });