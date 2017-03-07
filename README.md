# mutiplex-data-bus
- MultiplexDataBusのTypeScript用の実装を提供します
- Node.jsで利用することを想定しています

## Setup
### package.json
```
    "dependencies": {
        "@cross-border-bridge/multiplex-data-bus": "~2.0.0"
    },
```

## Usage
#### step 1: import
```typescript
import * as mdb from "@cross-border-bridge/multiplex-data-bus";
```

#### step 2: MultiplexDataBusの準備
DataBusまたは下位MultiplexDataBusのインスタンス と ID を指定して, インスタンスを生成します。

```typescript
    const child = <HTMLIFrameElement>document.getElementById("child");
    const dataBus = new db.PostMessageDataBus(child.contentWindow);
    const dataBus1 = new mdb.MultiplexDataBus(dataBus, "layer1");
    const dataBus2 = new mdb.MultiplexDataBus(dataBus1, "layer2");
```

#### step 3: 受信データの受け口を設定
`MultiplexDataBus#addHandler` を実行すると, 同一層（または上位層）から送信したデータのみを受信します。

```typescript
    dataBus1.addHandler((data) => {
        layer1 or layer2 へ send されたデータ受信時に実行する処理
    });
    dataBus2.addHandler((data) => {
        layer2 へ send されたデータ受信時に実行する処理
    });
```

> ハンドラの解除手段には, 以下2種類の方法があります
> - `データ受信時の処理` で `return true` をする
> - `MultiplexDataBus#removeHandler` を実行する

#### step 4: データを送信
`MultiplexDataBus#send` を実行すると, リモート側の同一層（または上位層）へデータを送信できます。

```typescript
    // リモート側のlayer1へデータを送信
    dataBus1.send(data);
    // リモート側のlayer2（及びlayer1）へデータを送信
    dataBus2.send(data);
```

#### step 5: 破棄
`MultiplexDataBus#destroy` で破棄できます。

```typescript
    dataBus2.destroy();
    dataBus1.destroy();
    dataBus.destroy();
```

## License
本リポジトリは MIT License の元で公開されています。
詳しくは [LICENSE](LICENSE) をご覧ください。
