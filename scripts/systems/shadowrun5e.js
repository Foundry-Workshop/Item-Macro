import { logger } from "../logger.js";
import { settings } from "../settings.js";

export function register_helper() {
  logger.info(`Registering Shadowrun5e System Helpers`);

  /*
   Override
 */
  game.shadowrun5e.rollItemMacro = (itemName) => {
    if (!game || !game.actors) return;

    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!speaker.actor) return;
    if (!actor) actor = game.actors.get(speaker.actor);
    const item = actor ? actor.items.find((i) => i.name === itemName) : null;
    if (!item) {
      return ui.notifications?.warn(`Your controlled Actor does not have an item named ${itemName}`);
    }

    // Trigger the item roll
    if (item.hasMacro() && settings.value("defaultmacro")) {
      return item.executeMacro();
    } else {
      return item.castAction();
    }
  }
}

export function sheetHooks() {
  const renderSheets = {
    SR5BaseActorSheet: ".item-text.item-name.has-desc"
  };

  const renderedSheets = {
  };

  return { render: renderSheets, rendered: renderedSheets };
}