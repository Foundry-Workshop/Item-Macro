import { logger } from "./logger.js";
import { settings } from "./settings.js";
import * as cyberpunk from "./systems/cyberpunk-red-core.js";
import * as demonlord from "./systems/demonlord.js";
import * as dnd5e from "./systems/dnd5e.js";
import * as dungeonworld from "./systems/dungeonworld.js";
import * as ose from "./systems/ose.js";
import * as sfrpg from "./systems/sfrpg.js";
import * as shadowrun5e from "./systems/shadowrun5e.js";
import * as swade from "./systems/swade.js";
import * as wfrp4e from "./systems/wfrp4e.js";
import * as worldbuilding from "./systems/worldbuilding.js";

export class helper {
  static register() {
    logger.info(`Registering Helper Functions.`);
    helper.registerItem();
    helper.systemHandler();
    helper.postMessage();
  }

  static registerItem() {
    Item.prototype.hasMacro = function () {
      let flag = this.getFlag(settings.id, `macro`);

      logger.debug("Item | hasMacro | ", { flag });
      return !!(flag?.command ?? flag?.data?.command);
    }

    Item.prototype.getMacro = function () {
      let hasMacro = this.hasMacro();
      let flag = this.getFlag(settings.id, `macro`);

      logger.debug("Item | getMacro | ", { hasMacro, flag });

      if (hasMacro) {
        const command = !!flag?.command;
        return new Macro(command ? flag : flag?.data);
      }

      return new Macro({ img: this.img, name: this.name, scope: "global", type: "script", });
    }

    Item.prototype.setMacro = async function (macro) {
      let flag = this.getFlag(settings.id, `macro`);

      logger.debug("Item | setMacro | ", { macro, flag });

      if (macro instanceof Macro) {
        const data = macro.toObject();
        return await this.setFlag(settings.id, `macro`, data);
      }
    }

    Item.prototype.executeMacro = async function (...args) {
      if (!this.hasMacro()) return;
      const type = settings.isV10 ? this.getMacro()?.type : this.getMacro()?.data.type;
      switch (type) {
        case "chat":
          //left open if chat macros ever become a thing you would want to do inside an item?
          break;
        case "script":
          return await this._executeScript(...args);
      }
    }
    Item.prototype._executeScript = async function (...args) {
      //add variable to the evaluation of the script
      const item = this;
      const macro = item.getMacro();
      const speaker = ChatMessage.getSpeaker({ actor: item.actor });
      const actor = item.actor ?? game.actors.get(speaker.actor);

      /* MMH@TODO Check the types returned by linked and unlinked */
      const token = canvas.tokens?.get(speaker.token);
      const character = game.user.character;
      const event = getEvent();

      logger.debug("Item | _executeScript | ", { macro, speaker, actor, token, character, item, event, args });

      if (helper.systemValidation(macro) === false)
        return;

      //build script execution
      const scriptFunction = Object.getPrototypeOf(async function () { }).constructor;
      const body = macro.command ?? macro?.data?.command;
      const fn = new scriptFunction("item", "speaker", "actor", "token", "character", "event", "args", body)

      logger.debug("Item | _executeScript | ", { body, fn });

      //attempt script execution
      try {
        return await fn.bind(macro)(item, speaker, actor, token, character, event, args);
      } catch (err) {
        ui.notifications.error(settings.i18n("error.macroExecution"));
        logger.error(err);
      }

      function getEvent() {
        let a = args[0];
        if (a instanceof Event) return args[0].shift();
        if (a?.originalEvent instanceof Event) return args.shift().originalEvent;
        return undefined;
      }
    }
  }

  static systemHandler() {
    let sheetHooks = helper.getSheetHooks();

    switch (game.system.id) {
      case "cyberpunk-red-core":
        if (settings.value("defaultmacro")) cyberpunk.register_helper();
        break;
      case "demonlord":
        if (settings.value("defaultmacro")) demonlord.register_helper();
        break;
      case "dnd5e":
        if (settings.value("defaultmacro")) dnd5e.register_helper();
        dnd5e.applyTidy5eCompatibility();
        break;
      case "dungeonworld":
        if (settings.value("defaultmacro")) dungeonworld.register_helper();
        break;
      case "ose":
        if (settings.value("defaultmacro")) ose.register_helper();
        break;
      case "sfrpg":
        if (settings.value("defaultmacro")) sfrpg.register_helper();
        break;
      case "shadowrun5e":
        if (settings.value("defaultmacro")) shadowrun5e.register_helper();
        break;
      case "swade":
        if (settings.value("defaultmacro")) swade.register_helper();
        break;
      case "wfrp4e":
        if (settings.value("defaultmacro")) wfrp4e.register_helper();
        break;
      case "worldbuilding":
        if (settings.value("defaultmacro")) worldbuilding.register_helper();
        break;
    }

    if (sheetHooks) {
      Object.entries(sheetHooks).forEach(([preKey, obj]) => {
        if (obj instanceof Object)
          Object.entries(obj).forEach(([key, str]) => {
            Hooks.on(`${preKey}${key}`, (app, html, _data) => changeButtonExecution(app, html, str, sheetHooks.onChange));
          });
      });
    }

    async function changeButtonExecution(app, html, str, onChange = []) {
      logger.debug("changeButtonExecution : ", { app, html, str });

      if (helper.getSheetHooks().rendered[app.constructor.name] !== undefined)
        await helper.waitFor(() => app.rendered);


      if (app && !app.isEditable) return;
      let itemImages = html.find(str);

      logger.debug("changeButtonExecution | ", { app, html, str, itemImages });

      for (let img of itemImages) {
        img = $(img);

        // @todo refactor into class-based systems with default parent method
        const itemTag = game.system.hasOwnProperty('itemTag') 
          ? game.system.itemTag() 
          : (game.system.id === 'shadowrun5e' ? '.list-item' : '.item');
        const li = img.parents(itemTag);
        const id = li.attr("data-item-id") ?? img.attr("data-item-id");

        if (!id) {
          logger.debug("Id Error | ", img, li, id);
          continue;
        }

        const item = app.actor.items.get(id);

        logger.debug("changeButtonExecution | for | ", { img, li, id, item });

        if (!item.hasMacro()) {
          continue;
        }

        if (settings.value("click")) {
          img.contextmenu((event) => {
            item.executeMacro(event);
          })
        } else {
          img.off();
          img.click((event) => {
            logger.debug("Img Click | ", img, event);
            item.executeMacro(event);
          });
        }
        onChange.forEach(fn => fn(img, item, html));
      }
    }
  }

  static getSheetHooks() {
    switch (game.system.id) {
      case "cyberpunk-red-core":
        if (settings.value("charsheet")) return cyberpunk.sheetHooks();
        break;
      case "demonlord":
        if (settings.value("charsheet")) return demonlord.sheetHooks();
        break;
      case "dnd5e":
        if (settings.value("defaultmacro")) return dnd5e.sheetHooks();
        break;
      case "dungeonworld":
        if (settings.value("charsheet")) return dungeonworld.sheetHooks();
        break;
      case "ose":
        if (settings.value("charsheet")) return ose.sheetHooks();
        break;
      case "sfrpg":
        if (settings.value("charsheet")) return sfrpg.sheetHooks();
        break;
      case "shadowrun5e":
        if (settings.value("charsheet")) return shadowrun5e.sheetHooks();
        break;
      case "swade":
        if (settings.value("charsheet")) return swade.sheetHooks();
        break;
      case "wfrp4e":
        if (settings.value("charsheet")) return wfrp4e.sheetHooks();
        break;
      case "worldbuilding":
        if (settings.value("charsheet")) return worldbuilding.sheetHooks();
        break;
    }
  }

  static addContext(contextOptions, origin) {
    if (!game.user.isGM) return;
    logger.info("Adding Context Menu Items.");
    contextOptions.push({
      name: settings.i18n("context.label"),
      icon: '<i class="fas fa-redo"></i>',
      condition: () => game.user.isGM,
      callback: li => updateMacros(origin, li?.data("entry-id")),
    });

    async function updateMacros(origin, _id) {
      logger.info("Update Macros Called | ", origin, _id);
      let item = undefined, updateInfo = [];
      if (origin === "Directory") item = game.items.get(_id);
      //if(origin === "Compendium") /* No clue */

      let result = await Dialog.confirm({
        title: settings.i18n("context.confirm.title"),
        content: `${settings.i18n("context.confirm.content")} <br><table><tr><td> Name : <td> <td> ${item.name} </td></tr><tr><td> ID : <td><td> ${item.id} </td></tr><tr><td> Origin : <td> <td> Item ${origin} </td></tr></table>`,
      });

      let macro = item.getMacro();
      logger.debug("updateMacros Info | ", item, macro, result);

      if (result) {
        //update game items
        for (let i of game.items.filter(e => e.name === item.name && e.id !== item.id)) {
          await updateItem({ item: i, macro, location: "Item Directory" });
        }

        //update actor items
        for (let a of game.actors) {
          await updateActor({ actor: a, name: item.name, macro, location: `Actor Directory [${a.name}]` });
        }
        //update scene entities
        for (let s of game.scenes) {
          for (let t of s.data.tokens.filter(e => !e.actorLink)) {
            let token = new Token(t, s);
            await updateActor({ actor: token.actor, name: item.name, macro, location: `Scene [${s.name}] Token [${t.name}]` });
          }
        }

        await Dialog.prompt({
          title: settings.i18n("context.prompt.title"),
          content: `${settings.i18n("context.prompt.content")}<hr>${updateInfo.reduce((a, v) => a += `<table><tr><td> Actor : <td> <td> ${v.actor} </td></tr><tr><td> Token : <td> <td> ${v.token} </td></tr><tr><td> Item : <td> <td> ${v.item} </td></tr><tr><td> Location : <td> <td> ${v.location} </td></tr></table>`, ``)}`,
          callback: () => { },
          options: { width: "auto", height: "auto" },
        });
      }

      async function updateActor({ actor, name, macro, location }) {
        logger.debug("Attempting Actor Update | ", actor, name, macro);
        for (let item of actor?.items?.filter(i => i.data.name === name) || [])
          await updateItem({ item, macro, location });
      }
      async function updateItem({ item, macro, location }) {
        logger.debug("Attempting Item Update | ", item, macro);
        await item.setMacro(macro);
        updateInfo.push({
          actor: item?.actor.id,
          token: item?.actor?.token?.id,
          item: item.id,
          location
        });
      }
    }
  }

  static async waitFor(fn, m = 200, w = 100, i = 0) {
    while (!fn(i, ((i * w) / 100)) && i < m) {
      i++;
      await helper.wait(w);
    }

    return i !== m;
  }

  static async wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  static systemValidation(macro) {
    switch (game.system.id) {
      case 'dnd5e':
        return dnd5e.systemValidation(macro);
      default:
    }

    return true;
  }

  static async postMessage() {
    if (settings.value('welcome') === false) {
      await ChatMessage.create({
        speaker: {
          alias: "Item Macro",
          actor: null,
          scene: null,
          token: null
        },
        whisper: [game.user],
        flavor: "Automated welcome message",
        content: `
      <h3 class="nue">Thanks for updating the Item Macro</h3>
      <p class="nue">Hello, I am Forien and with Kekilla's permission I took this module over from him. My job here is mostly to keep this module maintained and working on Foundry v11 and future updates. That said I am not opposed to expanding this module with additional systems or new features if there is big demand enough.</p>
      <p class="nue">Since I took this module with next to no knowledge, keep in mind that I might not know if something is broken or not working as intended. Please feel free to contact me on Foundry Discord by pinging <code>Forien</code>. You can also join <a href="https://discord.gg/XkTFv8DRDc" target="_blank">my Discord</a> or report an <a href="https://github.com/Foundry-Workshop/Item-Macro/issues" target="_blank"> Issue on GitHub</a>.</p>
      <p class="nue">I'm creating Foundry modules (full list of which you can find on my <a href="https://foundryvtt.com/community/forien/" target="_blank">Foundry Profile</a>) and maintaining them by spending my free time. If you would like to support me and the development of those modules, please consider <a href="https://www.patreon.com/foundryworkshop" target="_blank"><b>becoming a Patron</b></a> or donating through <a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=6P2RRX7HVEMV2&source=url" target="_blank">PayPal</a> or <a href="https://ko-fi.com/forien" target="_blank">Ko-Fi</a></p>
      `,
      });
    }
    game.settings.set(settings.id, 'welcome', true);
  }

}
