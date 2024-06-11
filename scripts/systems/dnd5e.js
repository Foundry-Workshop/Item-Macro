import {logger} from "../logger.js";
import {settings} from "../settings.js";

function preUseItem(item, config, options) {
  if (options.skipItemMacro === true)
    return true;

  if (!item.hasMacro())
    return true;

  if (!settings.value("defaultmacro"))
    return true;

  item.executeMacro({config, options}).then((result) => {
    if (result === true) {
      options.skipItemMacro = true;
      item.use(config, options);
    }
  });

  return false;
}

export function register_helper() {
  logger.info(`Registering DND5E Helpers`);

  if (foundry.utils.isNewerVersion("3.0.0", game.system.version))
    return ui.notifications.warn("itemacro.dnd5e.systemDeprecationv3", {localize: true, permanent: true});


  Hooks.on("dnd5e.preUseItem", preUseItem)
}

export function systemValidation(macro) {
  if (macro.command?.includes('.use()')) {
    ui.notifications.warn("itemacro.dnd5e.useFunctionWarning", {localize: true, permanent: true});
    return false;
  }

  return true;
}

export function sheetHooks() {
  const renderSheets = {};
  const renderedSheets = {};

  return {render: renderSheets, rendered: renderedSheets};
}
