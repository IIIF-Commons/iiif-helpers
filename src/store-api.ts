export type StoreApi<State> = {
  setState: {
    (partial: State | Partial<State> | ((state: State) => State | Partial<State>), replace?: false): void;
    (state: State | ((state: State) => State), replace: true): void;
  };
  getState: () => State;
  getInitialState: () => State;
  subscribe: (listener: (state: State, previousState: State) => void) => () => void;
  destroy: () => void;
};

export type SelectorStoreApi<State> = Omit<StoreApi<State>, 'subscribe'> & {
  subscribe: StoreApi<State>['subscribe'] & {
    <Selection>(
      selector: (state: State) => Selection,
      listener: (selection: Selection, previousSelection: Selection) => void,
      options?: {
        equalityFn?: (left: Selection, right: Selection) => boolean;
        fireImmediately?: boolean;
      }
    ): () => void;
  };
};
