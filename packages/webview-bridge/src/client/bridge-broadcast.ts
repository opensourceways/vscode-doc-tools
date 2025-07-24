import { BroadcastT, MessageT, OPERATION_TYPE, SOURCE_TYPE } from '../@types/message';
import { Bridge } from './bridge';

const symbolIsInit = Symbol('symbolIsInit');
const symbolIInit = Symbol('symbolInit');
const symbolListenerMap = Symbol('symbolListenerMap');
const symbolAddListener = Symbol('symbolAddListener');
const symbolRemoveListener = Symbol('symbolRemoveListener');
const symbolCallback = Symbol('symbolCallback');

export class BroadcastBridge {
  private static [symbolIsInit] = false;
  private static [symbolListenerMap] = new Map<string, Set<(...args: any[]) => void>>();

  static [symbolIInit]() {
    if (this[symbolIsInit]) {
      return;
    }

    this[symbolIsInit] = true;
    Bridge.getInstance().addBroadcastListener((data: BroadcastT) => {
      const { name, extras } = data;
      BroadcastBridge[symbolCallback](name, extras);
    });
  }

  static [symbolAddListener](name: string, callback: (...args: any[]) => void) {
    if (!this[symbolIsInit]) {
      this[symbolIInit]();
    }

    if (!(this[symbolListenerMap].get(name) instanceof Set)) {
      this[symbolListenerMap].set(name, new Set());
    }

    this[symbolListenerMap].get(name)!.add(callback);
  }

  static [symbolRemoveListener](name: string, callback: (...args: any[]) => void) {
    if (!(this[symbolListenerMap].get(name) instanceof Set)) {
      return;
    }

    this[symbolListenerMap].get(name)!.delete(callback);
  }

  static [symbolCallback](name: string, extras: any[]) {
    const callbacks = this[symbolListenerMap].get(name);
    if (!callbacks) {
      return;
    }

    callbacks.forEach((callback) => callback(...extras));
  }

  static addMarkdownContentChangeListener(callback: (mdPath: string) => void) {
    this[symbolAddListener]('onMarkdownContentChange', callback);
  }

  static removeMarkdownContentChangeListener(callback: (mdPath: string) => void) {
    this[symbolRemoveListener]('onMarkdownContentChange', callback);
  }

  static addTocContentChangeListener(callback: (tocPath: string) => void) {
    this[symbolAddListener]('onTocContentChange', callback);
  }

  static removeTocContentChangeListener(callback: (tocPath: string) => void) {
    this[symbolRemoveListener]('onTocContentChange', callback);
  }
}
