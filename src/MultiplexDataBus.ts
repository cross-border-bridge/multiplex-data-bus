// Copyright © 2017 DWANGO Co., Ltd.

import { DataBus, DataBusHandler } from '@cross-border-bridge/data-bus';

/**
 * DataBus上に流すデータを多重化する機構
 */
export class MultiplexDataBus implements DataBus {
    private _dataBus: DataBus;
    private _dataId: string;
    private _handler: DataBusHandler;
    private _handlers: DataBusHandler[] = [];

    constructor(dataBus: DataBus, dataId: string) {
        this._dataBus = dataBus;
        this._dataId = dataId;
        this._handler = (...data: any[]): void => {
            if (data.length < 1 || data[0] !== this._dataId) return;
            data.splice(0, 1);
            var r: DataBusHandler[] = [];
            for (let h of this._handlers) {
                if (h.apply(this, data)) {
                    r.push(h);
                }
            }
            for (let h of r) {
                this.removeHandler(h);
            }
        };
        this._dataBus.addHandler(this._handler);
    }

    destroy(): void {
        if (!this._dataBus) return;
        this.removeAllHandlers();
        this._dataBus.removeHandler(this._handler);
        this._dataBus = undefined;
    }

    destroyed(): boolean {
        return !this._dataBus;
    }

    send(...data: any[]): void {
        if (!this._dataBus) return;
        data.unshift(this._dataId);
        this._dataBus.send.apply(this._dataBus, data);
    }

    addHandler(handler: DataBusHandler): void {
        if (!this._dataBus) return;
        this._handlers.push(handler);
    }

    removeHandler(handler: DataBusHandler): void {
        if (!this._dataBus || this._handlers.indexOf(handler) < 0) return;
        this._handlers.splice(this._handlers.indexOf(handler), 1);
    }

    removeAllHandlers(): void {
        if (!this._dataBus) return;
        this._handlers = [];
    }
}
