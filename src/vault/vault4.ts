import type { ActionListFromResource } from './utility/action-list-from-resource';
import { actionListFromResourceV4 } from './utility/action-list-from-resource';
import { Vault } from './vault';

export class Vault4 extends Vault {
  protected getActionListFromResource(): ActionListFromResource {
    return actionListFromResourceV4;
  }
}
