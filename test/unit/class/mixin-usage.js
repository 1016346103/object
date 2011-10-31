module('mixin-usage');

//mixin normal class
test('mixin normal class', function() {
	try {
		var A = new Class(function(){}); 
		var B = new Class(function() {
			Class.mixin(this, A);
		});
		new B();
		ok(true, 'mixin with an empty class');
	} catch (e) {
		ok(false, 'mixin with an empty class : ' + e);
	}

	var staticValue = 1;
	var X = new Class(function(){
		this.a = 'X';
		this.b = function(self) {
			return self.a;
		}
	});
	var A = new Class(function(){
		this.a = null;
		this.b = 1;
		this.c = {prop:1};
		this.d = function(self){
			return self.b;
		};
		this.e = staticmethod(function() {
			staticValue += 1;
		});
		this.f = classmethod(function(cls) {
			return cls.classProperty;
		});
		this.g = property(function(self) {
			return self.v;
		},function(self, v) {
			self.v = v;
		});
		this.h = new X();
	}); 
	A.classProperty = 'A';
	var B = new Class(function() {
		Class.mixin(this, A);
	});
	B.classProperty = 'B';

	var a = new A();
	var b = new B();
	equal(b.a, null, 'null value is inherited');
	equal(b.b, 1, 'normal value is inherited');
	equal(b.c.prop, 1, 'object value is inherited');

	ok(typeof b.d == 'function', 'normal function is inherited');
	equal(b.d(), 1, 'function inherited execute correctly');
	if(typeof instancemethod != 'undefined') {
		equal(a.d.__class__, instancemethod, 'instancemethod in parent');
		equal(b.d.__class__, instancemethod, 'instancemethod in sub');
	}

	b.e();
	equal(staticValue, 2, 'staticmethod execute correctly');
	equal(a.e.__class__, staticmethod, 'staticmethod in parent');
	equal(b.e.__class__, staticmethod, 'staticmethod in sub');

	equal(A.f(), 'A', 'classmethod execute correctly in parent');
	equal(B.f(), 'B', 'classmethod execute correctly in sub');
	equal(A.f.__class__, classmethod, 'classmethod in parent');
	equal(B.f.__class__, classmethod, 'classmethod in sub');
	raises(function() {
		a.f();
	}, 'can not call classmethod by instance');
	raises(function() {
		b.f();
	}, 'can not call classmethod by instance');

	a.set('g', 'ggg');
	equal(a.get('g'), 'ggg', 'property setter/getter is ok in parent');
	try {
		b.set('g', 'gg');
		equal(b.get('g'), 'gg', 'property setter/getter is ok in sub');
	} catch (e) {
		ok(false, 'property setter/getter throw error in sub : ' + e);
	}
	ok(a.__properties__.g != null, 'g is in parent.__properties__');
	ok(b.__properties__.g != null, 'g is in sub.__properties__');

	equal(b.h.a, 'X', 'Class property is inherited');
	equal(b.h.b(), 'X', 'Class property is inherited');
});

//nested mixin B.mixin(A),C.mixin(B) 
test('nested mixin', function() {
	var A = new Class(function() {
		this.a = 1;
	});
	var B = new Class(function() {
		Class.mixin(this, A);
	});
	var C = new Class(function() {
		Class.mixin(this, B);
	});
	var c = new C();
	equal(c.a, 1, 'nested mixin property is ok');
});

//circular mixin B.mixin(A), A.mixin(B)
test('circular mixin', function() {
	var A = new Class(function(){
		this.a = 1;
		ok(B == null, 'B is null currently, circular mixin won\' happen????');
		//Class.mixin(this, B);
	});
	var B = new Class(function(){
		this.a = 2;
		Class.mixin(this, A);
	});
	var a = new A();
	var b = new B();
	equal(a.a, 1, 'ok');
	equal(b.a, 2, 'ok');
});

//mixin exists module 
test('mixin exists module', function() {
	object.use('events', function(exports, events) {
		var A = new Class(function() {
			Class.mixin(this, events.Events);
		});

		var a = new A();
		ok(a._eventListeners != null, '_eventLiseners is not null after mixin events.Events');
		equal(Object.keys(a._eventListeners).length, 0, 'nothing in a._eventListeners');
		ok(a.addEvent != null, 'addEvent is not null after mixin events.Events');
		ok(a.removeEvent != null, 'removeEvent is not null after mixin events.Events');
		ok(a.fireEvent != null, 'fireEvent is not null after mixin events.Events');

		try {
			var B = new Class(function() {
				Class.mixin(this, events);
			});
			ok(true, 'mixin with a whole module is ok');
		} catch (e){
			ok(false, 'mixin with a whole module is ok : ' + e);
		}
	});
});

//mixin new module 
test('mixin new module', function() {
	object.add('new_module', function(exports, new_module) {
		this.cls = new Class(function(){
			this.a = 1;
		});
	});
	object.use('new_module', function(exports, new_module) {
		var A = new Class(function() {
			Class.mixin(this, new_module.cls);
		});
		var a = new A();
		equal(a.a, 1, 'from new_module');

		try {
			var B = new Class(function() {
				Class.mixin(this, new_module);
			});
			ok(true, 'mixin with a whole module is ok');
		} catch (e){
			ok(false, 'mixin with a whole module is ok : ' + e);
		}
	});
});
//mixin parent
test('mixin parent', function() {
	var A = new Class(function() {
		this.a = 1;
	});
	var B = new Class(A, function() {
		Class.mixin(this, A);
	});
	var b = new B();
	equal(b.a, 1, 'property value is ok');
});

//mixin override
test('mixin override', function() {
	var A = new Class(function(){
		this.a = 'A';
		this.b = 1;
		this.c = null;
		this.d = undefined;
		this.e = 1;
		this.f = true;
		this.g = false;
		this.h = 'A';
		this.i = 1;
		this.j = 1;
	});
	var B = new Class(function() {
		this.a = 'B';
		this.b = null;
		this.c = 1;
		this.d = 1;
		this.e = undefined;
		this.f = false;
		this.g = true;
		this.h = "";
		this.i = 0;
		this.j = NaN;
		Class.mixin(this, A);
	});

	var b = new B();
	equal(b.a, 'B', 'parent-A, sub-B, value should be B');
	equal(b.b, null, 'parent-1, sub-null, value should be null');
	equal(b.c, 1, 'parent-null, sub-1, value should be 1');
	equal(b.d, 1, 'parent-undefined, sub-1, value should be 1');
	equal(b.e, undefined, 'parent-1, sub-undefined, value should be undefined');
	equal(b.f, false, 'parent-true, sub-false, value should be false');
	equal(b.g, true, 'parent-false, sub-true, value should be true');
	equal(b.h, '', 'parent-"A", sub-"", value should be ""');
	equal(b.i, 0, 'parent-1, sub-0, value should be 0');
	ok(isNaN(b.j), 'parent-1, sub-NaN, value should be NaN');
});
//mixin _ and __
test('mixin _ and __', function() {
	var A = new Class(function() {
		this.a = 1;
		this._a = 1;
		this.__a = 1;
		this.___a = 1;
	});
	var B = new Class(function() {
		Class.mixin(this, A);
	});
	var b = new B();
	equal(b.a, 1, 'a is ok');
	equal(b._a, 1, '_a is ok');
	equal(b.__a, undefined, '__a can not be mixined');
	equal(b.___a, undefined, '__a can not be mixined');
});

//mixin special method : set/get/initialize/__properties__
test('mixin special methods : set/get/_set/constructor/initialize/__properties__', function() {
	var A = new Class(function() {
		this.set = 1;
		this.get = 1;
		this._set = 1;
		this.constructor = 1;
		this.initialize = function(self) {
			return 1;
		}
		this.__properties__ = 1;
	});
	var B = new Class(function() {
		Class.mixin(this, A);
		this.initialize = function(self) {
			return 2;
		};
	});
	var b = new B();
	ok(b.set != 1, 'set can not be mixined');
	ok(b.get != 1, 'set can not be mixined');
	ok(b._set != 1, 'set can not be mixined');
	ok(b.constructor != 1, 'constructor can not be mixined');
	equal(b.initialize(), 2, 'initialize can not be mixined');
	ok(b.__properties__ != 1, '__properties__ can not be mixined');
});

//mixin many objs
test('mixin many objects', function() {
	var A = new Class(function(){
		this.a = 'A';
	});
	var B = new Class(function() {
		this.a = 'B';
	});
	var C = new Class(function() {
		Class.mixin(this, A);
		Class.mixin(this, B);
	});
	var c = new C();
	equal(c.a, 'A', 'ClassA-A, ClassB-B, value should be A');
});

//mixin an list of classes
test('mixin an list of classes', function() {
	var A = new Class(function(){
		this.a = 1;
	});
	var B = new Class(function(){
		this.b = 1;
	});
	try {
		var C = new Class(function() {
			Class.mixin(this, [A, B]);
		});
		ok(true, 'support Class.mixin(this, [A, B]) successfully');
	} catch (e) {
		ok(false, 'support Class.mixin(this, [A, B]) successfully : ' + e);
	}
	
	var D = new Class(function() {
		Class.mixin(this, A, B);
	});
	var d = new D();
	equal(d.a, 1, 'a should be 1 after Class.mixin(this, A, B)');
	equal(d.b, 1, 'b should be 1 after Class.mixin(this, A, B)');
});