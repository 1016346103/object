object.define('ui/addon.js', 'ui, string', function(require, exports) {

var ui = require('ui');
var string = require('string');

this.AddonClassClass = new Class(Type, function() {

	this.__new__ = function(cls, name, base, dict) {

		var members = (base.get('__members') || []).slice();
		var variables = (base.get('__variables') || []).slice();

		Object.keys(dict).forEach(function(name) {
			if (name.indexOf('__') == 0 || name == 'initialize') {
				return;
			}
			else if (name.indexOf('$') == 0) {
				variables.push(name);
			}
			else {
				members.push(name);
			}
		});
		// 如果不带下划线，就有可能覆盖掉自定义的方法，也就意味着开发者不能定义这些名字的成员
		dict.__variables = variables;
		dict.__members = members;

		return Type.__new__(cls, name, base, dict);
	};
});

// 继承于 ComponentClass
this.AddonClass = new exports.AddonClassClass(ui.ComponentClass, function() {

	this.__new__ = function(cls, name, base, dict) {

		// base是Component
		if (base !== ui.Component) {
			base = ui.Component;
		}

		var members = cls.get('__members');
		var variables = cls.get('__variables');

		// 生成vars
		var vars = {};
		variables.forEach(function(name) {
			vars[name.slice(1)] = cls.get(name);
		});
		// 变量递归，支持变量中引用变量
		variables.forEach(function(name) {
			var member = cls.get(name);
			if (typeof member == 'string') {
				vars[name.slice(1)] = string.substitute(member, vars);
			}
		});

		// 生成member
		members.forEach(function(nameTpl) {
			var name = string.substitute(nameTpl, vars);
			var member = cls.get(nameTpl);
			if (typeof member == 'function') {
				member = member(cls, vars);
			}
			dict[name] = member;
		});

		return Type.__new__(cls, name, base, dict);
	};

});

});
