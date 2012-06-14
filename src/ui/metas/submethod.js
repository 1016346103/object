object.define('ui/metas/submethod.js', function(require, exports) {

/**
 * 定义一个向子元素注册事件的方法
 * @decorator
 * @param name 一个函数名字
 */
function submethod(name) {
	// 名子要匹配带有$后缀
	var match = name.match(/^([a-zA-Z1-9]+)_([a-zA-Z1-9]+)([\$0-9]*)$/);
	if (!match) {
		// 名字不匹配，返回的decorator返回空
		return function() {
			return null;
		};
	}
	var sub = match[1];
	var eventType = match[2];
	// 后面带的无用的东西，只是用来区分addon的
	var surfix = match[3];
	return function(func) {
		func.meta = new SubMethodMeta(sub, eventType, name);
		return func;
	};
};

function SubMethodMeta(sub1, sub2, fullname) {
	this.sub1 = sub1;
	this.sub2 = sub2;
	this.fullname = fullname;
}

SubMethodMeta.prototype.storeKey = 'subMethods';

SubMethodMeta.prototype.decorator = submethod;

SubMethodMeta.prototype.addTo = function(cls) {
	var meta = cls.get('meta');
	if (!meta[this.storeKey].some(this.equal, this)) {
		this.cls = meta.cls;
		meta[this.storeKey].push(this);
	}
};

SubMethodMeta.prototype.addAddonTo = function(addon, meta) {
	var func;
	var fullname;
	var newName;
	var newMember;
	var oGid = addon.get('gid');

	if (!meta[this.storeKey].some(this.strictEqual, this)) {
		fullname = this.fullname;
		newName = fullname + '$' + oGid;
		func = addon.get(fullname, false).im_func;
		// 重新包装，避免名字不同导致warning
		newMember = this.decorator(newName)(function() {
			return func.apply(meta, arguments);
		});
		Type.__setattr__(meta.cls, newName, newMember);
		newMember.meta.cls = this.cls;
		// 传递重新生成的这个meta
		meta[this.storeKey].push(newMember.meta);
	}
};

SubMethodMeta.prototype.strictEqual = function(other) {
	return this.equal(other) && this.cls === other.cls;
};

SubMethodMeta.prototype.equal = function(other) {
	return this.sub1 == other.sub1 && this.sub2 == other.sub2;
};

SubMethodMeta.prototype.init = function(self, name) {
	var sub1 = this.sub1;
	// 记录下来，render时从__subMethodsMap获取信息
	if (!self.__subMethodsMap[sub1]) {
		self.__subMethodsMap[sub1] = [];
	}
	self.__subMethodsMap[sub1].push(this);
};

this.exports = function(uiModule) {
	uiModule.decorators.push(submethod);
};

});
