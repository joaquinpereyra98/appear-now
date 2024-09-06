/**
 * Handle for init the settings on the world.
 */
export default function initSettings() {
  game.settings.register("appear-now", "tokenSize", {
    name: "Token Size",
    hint: "Adjust the size of the tokens that appear on screen.",
    scope: "client",
    config: true,
    type: Number,
    range: {
      min: 80,
      max: 300,
      step: 10,
    },
    default: 200,
  });

  game.settings.register("appear-now", "maxActors", {
    name: "Max Actors On Screen",
    hint: "Maximum number of actors that can appear on screen at once.",
    scope: "client",
    config: true,
    type: Number,
    default: 3,
  });

  game.settings.register("appear-now", "scrollSpeed", {
    name: "Text Scroll Speed",
    hint: "Adjust how fast the text scrolls (lower is faster).",
    scope: "client",
    config: true,
    type: Number,
    range: {
      min: 1,
      max: 5,
      step: 1,
    },
    default: 3,
  });
}
