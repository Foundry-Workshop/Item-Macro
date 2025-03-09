import { BaseSystem } from "../BaseSystem.mjs";
import { settings } from "../../settings.mjs";

export class Shadowrun5e extends BaseSystem {
  static system = 'shadowrun5e';

  get sheetRenderHooks() {
    const { render, rendered, onChange } = super.sheetRenderHooks;

    return { render, rendered, onChange };
  }

  registerSettings(settingsData) {
  }

  registerSheetListeners() {
  }

  registerOther() {
  }

  registerHooks() {
    Hooks.on("ready", () => {
      console.log("Item Macro | Shadowrun5e System Initialized");
    });

    Hooks.on("SR5_PreActorItemRoll", (actor, item) => {
      if (item.hasMacro() && settings.value("defaultmacro")) {
        item.executeMacro();
        return false;
      } else {
        return true;
      }
    });

    Hooks.on("renderSR5BaseActorSheet", (actorsheet, html, data) => {
      if (!settings.value("charsheet")) return true;

      const form = html[0] || data.form;
      const sheet = $(form);

      sheet.find('.item-name').on('mousedown', (event) => {
        event.preventDefault();
        if(event.button === 2 && !settings.value("click")) return;
        const iid = event.currentTarget.closest('.list-item').dataset.itemId; // from Helpers.listItemId(event);
        const item = actorsheet.actor.items.get(iid);

        if (item.hasMacro()) {
          item.executeMacro();
          return false;
        } else {
          return true;
        }
      });
    });
  }

  systemValidation(macro) {
    return true;
  }

  get itemTag() {
    return '.item-name';
  }
}
export class Shadowrun5e extends BaseSystem {
  static system = 'shadowrun5e';

  get sheetRenderHooks() {
    const {render, rendered, onChange} = super.sheetRenderHooks;

    render.SR5BaseActorSheet = ".item-text.item-name.has-desc";

    return {render, rendered, onChange};
  }

  registerSettings(settingsData) {
  }

  registerSheetListeners() {
  }

  registerOther() {
    game.shadowrun5e.rollItemMacro = this.rollItemMacro;
  }

  registerHooks() {
  }

  systemValidation(macro) {
    return true;
  }

  rollItemMacro(itemName) {
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

  get itemTag() {
    return '.list-item';
  }
}
