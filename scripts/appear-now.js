let activeTokens = [];
const tokenBuffer = 10; // Buffer between tokens for readability

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


// Main function that handles the appearance of the token and dialogue when a message is sent
Hooks.on("chatMessage", (chatLog, message, chatData) => {
  const actor = game.actors.get(chatData.speaker.actor);
  if (!actor) return;

  // Retrieve the token object
  let token;
  let tokenImg;
  if (chatData.speaker.token) {
    token = canvas.tokens.get(chatData.speaker.token); // Full token object from canvas
    if (token && token.document) {
      tokenImg = token.document.getFlag("appear-now", "appearNowImage") || token.document.texture.src;
    }
  }

  // If no token, fallback to the actor's prototype token and check for flag there
  if (!tokenImg) {
    tokenImg = actor.getFlag("appear-now", "appearNowImage") || actor.prototypeToken.texture.src;
  }

  if (!tokenImg) return;

  const tokenSize = game.settings.get("appear-now", "tokenSize");
  const maxActors = game.settings.get("appear-now", "maxActors");
  const scrollSpeed = game.settings.get("appear-now", "scrollSpeed") || 3;

  // Ensure we don't go over the max allowed actors on screen
  if (activeTokens.length >= maxActors) {
    const removedToken = activeTokens.shift();
    document.body.removeChild(removedToken);
  }

  const tokenElement = document.createElement("div");
  tokenElement.classList.add("appear-now-token");
  tokenElement.style.width = `${tokenSize}px`;
  tokenElement.style.height = `${tokenSize}px`;

  // Calculate starting position for the new token
  const totalTokenWidth = (activeTokens.length + 1) * (tokenSize + tokenBuffer);
  const leftOffset = Math.max(window.innerWidth / 2 - totalTokenWidth / 2, 0);

  tokenElement.style.position = "fixed";
  tokenElement.style.top = "50%";
  tokenElement.style.zIndex = "1"; // Set a low z-index to appear below other modals
  tokenElement.style.left = `${
    leftOffset + activeTokens.length * (tokenSize + tokenBuffer)
  }px`;
  tokenElement.style.transform = "translateY(-50%)"; // Centers vertically

  const img = document.createElement("img");
  img.src = tokenImg;
  img.style.width = "100%";
  img.style.height = "100%";
  tokenElement.appendChild(img);

  const dialogueBox = document.createElement("div");
  dialogueBox.classList.add("appear-now-dialogue");
  dialogueBox.innerText = message;
  dialogueBox.style.overflowY = "auto"; // Add scroll bar if needed
  dialogueBox.style.maxHeight = "100%"; // Ensure it fits within the token height

  tokenElement.appendChild(dialogueBox);
  document.body.appendChild(tokenElement);
  activeTokens.push(tokenElement);

  // Handle automatic scrolling
  let scrollPosition = 0;
  const scrollInterval = setInterval(() => {
    scrollPosition += scrollSpeed;
    dialogueBox.scrollTop = scrollPosition;

    // Stop auto-scrolling if reached the bottom
    if (scrollPosition >= dialogueBox.scrollHeight - dialogueBox.clientHeight) {
      clearInterval(scrollInterval);
      // Set timeout for 5 seconds after auto-scrolling finishes
      setTimeout(() => {
        document.body.removeChild(tokenElement);
        activeTokens = activeTokens.filter((t) => t !== tokenElement);

        // Shift remaining tokens to the left
        shiftTokensLeft();
      }, 5000); // 5 seconds after scrolling finishes
    }
  }, 100); // Adjust speed of scrolling if necessary

  shiftTokensLeft(); // Shift tokens when a new one is added
});

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
