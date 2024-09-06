import initSettings from "./setting.js";

let activeTokens = [];
const tokenBuffer = 10; // Buffer between tokens for readability

// INIT HOOK
Hooks.on('init', initSettings);

/**
 * Updated the renderTokenConfig hook to utilize the new <file-picker> element introduced in v12.
 * The file-picker component simplifies the process of assigning an "Appear Now Image" by handling file selection automatically.
 */
Hooks.on("renderTokenConfig", (app, html, data) => {
  const appearNowImage =
    app.object.getFlag("appear-now", "appearNowImage") || "";

  // Using the file-picker introduced on v12
  const newHtml = `
          <div class="form-group">
            <label>Appear Now Image</label>
            <div class="form-fields">
                <file-picker name="flags.appear-now.appearNowImage" type="imagevideo" value="${appearNowImage}"></file-picker>
            </div>
        </div>`;
  html.find("div.tab[data-tab='appearance']").append(newHtml);
});

/**
 *
 * The issue arises with the preUpdateToken hook. Document#setFlag triggers a database update, which in turn activates the hook again, causing an update loop.
 *
 * Hooks.on("preUpdateToken", (token, updateData) => {
 *   if (updateData.flags?.["appear-now"]?.appearNowImage) {
 *     token.setFlag("appear-now", "appearNowImage", updateData.flags["appear-now"].appearNowImage);
 *   }
 * });
 */

/**
 * This version of the chatMessage hook simplifies the original code by:
 * 
 * 1. Extracting repetitive code into helper functions (`createTokenElement`, `createDialogueBox`, and `autoScrollDialogue`).
 * 2. Streamlining the process of retrieving the token or actor image in a single line.
 * 3. Automatically removing old without unnecessary conditions.
 */

// Main function that handles the appearance of the token and dialogue when a message is sent
Hooks.on("chatMessage", (chatLog, message, chatData) => {
  const actor = game.actors.get(chatData.speaker.actor);
  if (!actor) return;

  const token = chatData.speaker.token
    ? canvas.tokens.get(chatData.speaker.token)
    : null;
  const tokenImg =
    token?.document.getFlag("appear-now", "appearNowImage") ||
    actor.getFlag("appear-now", "appearNowImage") ||
    token?.document.texture.src ||
    actor.prototypeToken.texture.src;
  if (!tokenImg) return;

  const tokenSize = game.settings.get("appear-now", "tokenSize");
  const maxActors = game.settings.get("appear-now", "maxActors");
  const scrollSpeed = game.settings.get("appear-now", "scrollSpeed") || 3;

  // Limit the number of displayed tokens
  if (activeTokens.length >= maxActors) {
    document.body.removeChild(activeTokens.shift());
  }

  // Create token element
  const tokenElement = createTokenElement(tokenSize, tokenImg);
  const dialogueBox = createDialogueBox(message);
  tokenElement.appendChild(dialogueBox);
  document.body.appendChild(tokenElement);
  activeTokens.push(tokenElement);

  // Scroll the dialogue
  autoScrollDialogue(dialogueBox, scrollSpeed, tokenElement);

  // Adjust token positions
  shiftTokensLeft();
});

// Create token element
function createTokenElement(tokenSize, tokenImg) {
  const tokenElement = document.createElement("div");
  tokenElement.classList.add("appear-now-token");
  tokenElement.style = `
    width: ${tokenSize}px; height: ${tokenSize}px; position: fixed; top: 50%; z-index: 1;
    left: ${calculateLeftOffset(tokenSize)}px; transform: translateY(-50%);
  `;

  const img = document.createElement("img");
  img.src = tokenImg;
  img.style = "width: 100%; height: 100%;";
  tokenElement.appendChild(img);

  return tokenElement;
}

// Create dialogue box
function createDialogueBox(message) {
  const dialogueBox = document.createElement("div");
  dialogueBox.classList.add("appear-now-dialogue");
  dialogueBox.innerText = message;
  dialogueBox.style = "overflow-y: auto; max-height: 100%;";
  return dialogueBox;
}

// Calculate left offset for token element
function calculateLeftOffset(tokenSize) {
  const totalTokenWidth = (activeTokens.length + 1) * (tokenSize + tokenBuffer);
  return (
    Math.max(window.innerWidth / 2 - totalTokenWidth / 2, 0) +
    activeTokens.length * (tokenSize + tokenBuffer)
  );
}

// Auto-scroll the dialogue
function autoScrollDialogue(dialogueBox, scrollSpeed, tokenElement) {
  let scrollPosition = 0;
  const scrollInterval = setInterval(() => {
    scrollPosition += scrollSpeed;
    dialogueBox.scrollTop = scrollPosition;
    if (scrollPosition >= dialogueBox.scrollHeight - dialogueBox.clientHeight) {
      clearInterval(scrollInterval);
      setTimeout(() => {
        document.body.removeChild(tokenElement);
        activeTokens = activeTokens.filter((t) => t !== tokenElement);
        shiftTokensLeft();
      }, 5000);
    }
  }, 100);
}

/**
 * REMOVE const tokenBuffer = 10, already declare on line 2
 */
// Function to shift tokens left when one is removed or a new one is added
function shiftTokensLeft() {
  const tokenSize = game.settings.get("appear-now", "tokenSize");
  const totalTokenWidth = activeTokens.length * (tokenSize + tokenBuffer);
  const leftOffset = Math.max(window.innerWidth / 2 - totalTokenWidth / 2, 0);

  activeTokens.forEach((t, index) => {
    t.style.left = `${leftOffset + index * (tokenSize + tokenBuffer)}px`;
  });
}
