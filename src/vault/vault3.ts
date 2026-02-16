import type { ActionListFromResource } from './utility/action-list-from-resource';
import { actionListFromResourceV3 } from './utility/action-list-from-resource';
import { Vault } from './vault';

export class Vault3 extends Vault {
  protected getActionListFromResource(): ActionListFromResource {
    return actionListFromResourceV3;
  }
}
