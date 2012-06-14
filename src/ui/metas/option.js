object.define('ui/metas/option.js', function(require, exports) {

/**
 * 声明一个option
 * 用法：
 * MyComponent = new Class(ui.Component, {
 *	myConfig: ui.option(1)
 * });
 * 这样MyComponent实例的myConfig属性值即为默认值1，可通过 set 方法修改
 */
function option(defaultValue, getter) {
	var meta = new OptionMeta(defaultValue, getter);
	function fget(self) {
		var name = prop.__name__;
		return self.getOption(name);
	}
	function fset(self, value) {
		var name = prop.__name__;
		return self.setOption(name, value);
	}
	var prop = property(fget, fset);
	prop.meta = meta;
	return prop;
};

function OptionMeta(defaultValue, getter) {
	this.defaultValue = defaultValue;
	this.getter = getter;
}

OptionMeta.prototype.addTo = function(cls, name, member) {
	var meta = cls.get('meta');
	meta.addOption(name);
};

/**
 * 将value转换成需要的type
 */
OptionMeta.prototype.ensureTypedValue = function(value) {
	var type = typeof this.defaultValue;

	if (type === 'number') return Number(value);
	else if (type === 'string') return String(value);
	else if (type === 'boolean') return Boolean(value);
};

OptionMeta.prototype.bindEvents = function(self, name) {
	if (!self.__subMethodsMap[name]) {
		return;
	}
	self.__subMethodsMap[name].forEach(function(meta) {
		var fullname = meta.fullname;
		var sub = meta.sub1;
		var type = meta.sub2;
		var fakeType = '__option_' + type + '_' + sub;
		self.addEventTo(self, fakeType, self.get(fullname));
	});
};

this.exports = function(uiModule) {
	uiModule.option = option;
};

});
