import {BaseSystem} from "../BaseSystem.mjs";

export class Pathfinder2e extends BaseSystem {
  static system = 'pf2e';

  registerSettings() {}

  registerSheetListeners() {}

  registerOther() {}

  registerHooks() {}

  get sheetRenderHooks() {
    const {render, rendered, onChange} = super.sheetRenderHooks;

    return {render, rendered, onChange};
  }

  systemValidation(macro) {
    return true;
  }
}