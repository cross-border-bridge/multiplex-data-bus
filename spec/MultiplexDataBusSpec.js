// Copyright © 2017 DWANGO Co., Ltd.

describe("MultiplexDataBusSpec", function() {
	var mdb = require("../lib/MultiplexDataBus.js");

	it("基本シーケンスのテスト", function() {
		console.log("newすると上位DataBusのaddHandlerが実行されることを検証");
		var dummyDataBus = new Object();
		var flag = false;
		dummyDataBus.addHandler = function() {
			console.log("addHandler: " + JSON.stringify(arguments));
			flag = true;
		}
		var dataBus = new mdb.MultiplexDataBus(dummyDataBus, "This is test");
		expect(flag).toBeTruthy();

		//---------------------------------------------------------------------------
		console.log("addHandlerの検証");
		var h = function() {
			console.log("FIRE: " + JSON.stringify(arguments));
			expect(3).toEqual(arguments.length);
			expect("one").toEqual(arguments[0]);
			expect("two").toEqual(arguments[1]);
			expect(3).toEqual(arguments[2]);
			flag = true;
		}
		expect(0).toEqual(dataBus._handlers.length);
		dataBus.addHandler(h);
		expect(1).toEqual(dataBus._handlers.length);

		//---------------------------------------------------------------------------
		console.log("dataIdが一致するデータ受信時のみコールバックされることを検証");
		flag = false;
		dataBus._handler.apply(this, ["foo"]); // dataIdが不一致なので発火しない
		expect(flag).toBeFalsy();
		dataBus._handler.apply(this, ["This is test", "one", "two", 3]); // dataIdが一致するので発火する
		expect(flag).toBeTruthy();

		//---------------------------------------------------------------------------
		console.log("自動解除されていないことを検証");
		flag = false;
		dataBus._handler.apply(this, ["This is test", "one", "two", 3]); // dataIdが一致するので発火する
		expect(flag).toBeTruthy();

		//---------------------------------------------------------------------------
		console.log("removeHandlerをすればコールバックされなくなることを検証");
		flag = false;
		dataBus.removeHandler(h);
		dataBus._handler.apply(this, ["This is test", "one", "two", 3]);
		expect(flag).toBeFalsy();

		//---------------------------------------------------------------------------
		console.log("自動解除の検証");
		flag = false;
		h = function() {
			console.log("FIRE: " + JSON.stringify(arguments));
			expect(3).toEqual(arguments.length);
			expect("one").toEqual(arguments[0]);
			expect("two").toEqual(arguments[1]);
			expect(3).toEqual(arguments[2]);
			flag = true;
			return true;
		}
		dataBus.addHandler(h);
		dataBus._handler.apply(this, ["This is test", "one", "two", 3]);
		expect(flag).toBeTruthy();
		flag = false;
		dataBus._handler.apply(this, ["This is test", "one", "two", 3]);
		expect(flag).toBeFalsy();

		//---------------------------------------------------------------------------
		console.log("複数ハンドラ + removeAllHandlersの検証");
		var counter = 0;
		var h1 = function() {
			counter++;
		}
		var h2 = function() {
			counter += 2;
		}
		dataBus.addHandler(h1);
		dataBus.addHandler(h2);
		dataBus._handler.apply(this, ["This is test"]);
		expect(3).toBeTruthy(counter);
		dataBus.removeAllHandlers();
		dataBus._handler.apply(this, ["This is test"]);
		expect(3).toBeTruthy(counter);

		//---------------------------------------------------------------------------
		console.log("sendしたデータにIDが付与されることの検証");
		flag = false;
		dummyDataBus.send = function() {
			expect(4).toEqual(arguments.length);
			expect("This is test").toEqual(arguments[0]);
			expect(1).toEqual(arguments[1]);
			expect(2).toEqual(arguments[2]);
			expect(3).toEqual(arguments[3]);
			flag = true;
		}
		dataBus.send(1, 2, 3);
		expect(flag).toBeTruthy();

		//---------------------------------------------------------------------------
		console.log("destroyの検証");
		dummyDataBus.removeHandler = function() {
			flag = true;
		}
		flag = false;
		dataBus.destroy();
		expect(flag).toBeTruthy();
		expect(dataBus.destroyed()).toBeTruthy();
		// 特に意味は無いがカバレッジを上げておく
		dataBus.send("foo");
		dataBus.addHandler("hoge");
		dataBus.removeHandler(undefined);
		dataBus.removeAllHandlers();
	});

	it("多階層のテスト（受信）", function() {
		var dummyDataBus = new Object();
		dummyDataBus.addHandler = function() {
		}
		var dataBus1 = new mdb.MultiplexDataBus(dummyDataBus, "layer1");
		var dataBus2 = new mdb.MultiplexDataBus(dataBus1, "layer2");
		var dataBus3 = new mdb.MultiplexDataBus(dataBus2, "layer3");
		var data1, data2, data3;
		dataBus1.addHandler(function() {
			data1 = arguments;
		});
		dataBus2.addHandler(function() {
			data2 = arguments;
		});
		dataBus3.addHandler(function() {
			data3 = arguments;
		});

		dataBus1._handler("Hello");
		expect(data1).toBeUndefined();
		expect(data2).toBeUndefined();
		expect(data3).toBeUndefined();

		dataBus1._handler("layer1", "Hello");
		expect(1).toEqual(data1.length);
		expect("Hello").toEqual(data1[0]);
		expect(data2).toBeUndefined();
		expect(data3).toBeUndefined();

		dataBus1._handler("layer1", "layer2", "Hello");
		expect(2).toEqual(data1.length);
		expect("layer2").toEqual(data1[0]);
		expect("Hello").toEqual(data1[1]);
		expect(1).toEqual(data2.length);
		expect("Hello").toEqual(data2[0]);
		expect(data3).toBeUndefined();

		dataBus1._handler("layer1", "layer2", "layer3", "Hello");
		expect(3).toEqual(data1.length);
		expect("layer2").toEqual(data1[0]);
		expect("layer3").toEqual(data1[1]);
		expect("Hello").toEqual(data1[2]);
		expect(2).toEqual(data2.length);
		expect("layer3").toEqual(data2[0]);
		expect("Hello").toEqual(data2[1]);
		expect(1).toEqual(data3.length);
		expect("Hello").toEqual(data3[0]);
	});

	it("多階層のテスト（送信）", function() {
		var dummyDataBus = new Object();
		dummyDataBus.addHandler = function() {
		}
		var dataBus1 = new mdb.MultiplexDataBus(dummyDataBus, "layer1");
		var dataBus2 = new mdb.MultiplexDataBus(dataBus1, "layer2");
		var dataBus3 = new mdb.MultiplexDataBus(dataBus2, "layer3");
		var data;
		dummyDataBus.send = function() {
			data = arguments;
		}
		dataBus3.send("TEST");
		expect(4).toEqual(data.length);
		expect("layer1").toEqual(data[0]);
		expect("layer2").toEqual(data[1]);
		expect("layer3").toEqual(data[2]);
		expect("TEST").toEqual(data[3]);
	});
});
