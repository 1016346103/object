module('call parent');

test('common useage of parent method', function() {
	expect(2);
	var A = new Class(function() {
		this.a = function(self) {
			ok(true, 'parent method is called');
		}
	});
	var B = new Class(A, function() {
		this.a = function(self) {
			ok(true, 'call parent method');
			this.parent();
		}
	});
	var b = new B();
	b.a();
});

test('caller of parent should be self, not this', function() {
	var A = new Class(function() {
		this.a = function(self) {
		}
	});
	var B = new Class(A, function() {
		this.a = function(self) {
			self.parent();
		}
	});
	var b = new B();
	try {
		b.a();
		ok(true, 'caller of parent should be self, not this');
	} catch (e) {
		ok(false, 'caller of parent should be self, not this : ' + e);
	}
});

test('has no parent method', function(){
	var A = new Class(function() {});
	var B = new Class(A, function() {
		this.a = function(self) {
			this.parent();
		}
	});
	var b = new B();
	try {
		b.a();
		ok(true, 'has no parent method, should be considerd');
	} catch (e) {
		ok(false, 'has no parent method, should be considerd : ' + e);
	}

	var A = new Class(function() {
		this.a = null;
	});
	var B = new Class(A, function() {
		this.a = function(self) {
			this.parent();
		}
	});
	var b = new B();
	try {
		b.a();
		ok(true, 'parent is null, should be considerd');
	} catch (e) {
		ok(false, 'parent is null, should be considerd : ' + e);
	} 

	var A = new Class(function() {
		this.a = 1;//true/false/''/other value
	});
	var B = new Class(A, function() {
		this.a = function(self) {
			this.parent();
		}
	});
	var b = new B();
	try {
		b.a();
		ok(true, 'parent is not function, should be considerd');
	} catch (e) {
		ok(false, 'parent is not function, should be considerd : ' + e);
	} 
});
//parent throw error
test('parent throw error', function() {
	var A = new Class(function() {
		this.a = function(self) {
			throw 'error in parent';
		}
	});
	var B = new Class(A, function() {
		this.a = function(self) {
			this.parent();
		}
	});
	var b = new B();
	try {
		b.a();
		ok(true, 'parent throw error, should be considerd');
	} catch (e) {
		ok(false, 'parent throw error, should be considerd : ' + e);
	} 
});

//initialize parent
test('parent method is intialize', function() {
	var globalValue = 0;
	var A = new Class(function() {
		this.initialize = function(self) {
			equal(globalValue, 1, 'step2 : intialize in parent');
			globalValue++;
			self.a = 1;
		}
	});
	var B = new Class(A, function() {
		this.initialize = function(self) {
			equal(globalValue, 0, 'step1 : initialize in sub class');
			globalValue++;
			this.parent(self);
		}
	}); 
	var b = new B();
	equal(globalValue, 2, 'step3 : after create class successfully');
	equal(b.a, 1, 'sub.a is setted by parent.intialize');
});

//parent is instancemethod//dtaticmethod/classmethod
test('parent method is instancemethod/staticmethod/classmethod/property', function() {
	var A = new Class(function() {
		this.a = staticmethod(function() {
			ok(true, 'staticmethod is called by xxx.parent()');
		});
		this.b = classmethod(function(cls) {
			ok(true, 'classmethod is called by xxx.parent()');
		});
		this.c = function(self) {
			ok(true, 'instancemethod is called by xxx.parent()');
		};
		this.d = property(function(self){
			}, function(self, a){
			}
		);
	});
	var B = new Class(A, function() {
		this.a = function() {
			this.parent();
		};
		this.b = function(self) {
			this.parent();
		};
		this.c = function(self) {
			this.parent();
		};
		this.d = function(self) {
			this.parent();
		};
	});
	var b = new B();
	b.a();
	b.b(); //can call classmethod of parent class by instance of sub class ??? 
	b.c();
	try {
		b.d();
		ok(true, 'property in parent can not be called by sub.parent');
	} catch (e) {
		ok(false, 'property in parent can not be called by sub.parent : ' + e);
	}
});
// sub method is instancemethod/staticmethod/classmethod/property
test('parent method is instancemethod/staticmethod/classmethod/property', function() {
	var A = new Class(function() {
		this.a = function(self) {
			ok(true, 'instancemethod called by xxx.parent, which is instancemethod');
		};
		this.b = function(self) {
			ok(true, 'instancemethod called by xxx.parent, which is classmethod');
		};
		this.c = function(self) {
			ok(true, 'instancemethod called by xxx.parent, which is staticmethod');
		};
		this.d = function(self) {
			ok(false, 'instancemethod d should not be called by sub class, whose d is property');
		};	
		this.e = property(function(self) {
			return 1;
		});
	});
	var B = new Class(A, function() {
		this.a = function() {
			this.parent();
		};
		this.b = classmethod(function(cls) {
			this.parent();
		});
		this.c = staticmethod(function() {
			ok(true, 'staticmethod of sub class is called successfully');
			this.parent();
		});
		this.d = property(function(self){
				ok(true, 'before xxx.parent called in property');
				this.parent();
				ok(true, 'after xxx.parent called in property');
				return 1;
			}, function(self, a){
			}
		);
		this.e = property(function(self) {
			return this.parent();
		});
	});
	var b = new B();
	b.a();
	B.b();
	try {
		b.c();
		ok(true, 'parent method called in staticmethod, which should be considered');
	} catch (e) {
		ok(false, 'parent method called in staticmethod, which should be considered : ' + e);
	}
	b.d();
	try {
		b.get('d');
		ok(true, 'property setter/getter can call xxx.parent too');
	} catch (e) {
		ok(false, 'property setter/getter can call xxx.parent too : ' + e);
	}
	try {
		equal(b.e(), 1, 'property can be called by b.e()/b.e(value), and parent also can be used');
	} catch (e) {
		ok(false, 'property can be called by b.e()/b.e(value), and parent also can be used');
	}
});
//the order of parent method execution
test('order of parent', function() {
	var counter = 0;
	var A = new Class(function() {
		this.a = function() {
			counter ++;
			equal(counter, 2, 'parent called in C');
		}
	});
	var B = new Class(A, function() {
		this.a = function() {
			equal(counter, 1, 'before parent called in B(A->B->C)');
			this.parent();
			equal(counter, 2, 'after parent called in B(A->B->C)');
			counter++;
		}
	});
	var C = new Class(B, function() {
		this.a = function() {
			equal(counter, 0, 'before parent called in C(A->B->C)');
			counter ++;
			this.parent();
			equal(counter, 3, 'after parent called in C(A->B->C)');
		}
	});
	var c = new C();
	c.a();
});
