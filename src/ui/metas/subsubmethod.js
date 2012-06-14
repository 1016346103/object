object.define('ui/metas/subsubmethod.js', function(require, exports) {

function subsubmethod(name) {
	// 名子要匹配带有$后缀
	var match = name.match(/^([a-zA-Z1-9]+)_([a-zA-Z1-9]+)_([a-zA-Z1-9]+)([\$0-9]*)$/);
	if (!match) {
		// 名字不匹配，返回的decorator返回空
		return function() {
			return null;
		};
	}
	var sub = match[1];
	var methodName = match[2];
	var aopType = match[3];
	// 后面带的无用的东西，只是用来区分addon的
	var surfix = match[4];
	return function(func) {
		func.meta = new SubSubMethodMeta(sub, methodName, aopType, name);
		return func;
	};
};

function SubSubMethodMeta(sub1, sub2, sub3, fullname) {
	this.sub1 = sub1;
	this.sub2 = sub2;
	this.sub3 = sub3;
	this.fullname = fullname;
}

SubSubMethodMeta.prototype.storeKey = 'subSubMethods';

SubSubMethodMeta.prototype.decorator = subsubmethod;

SubSubMethodMeta.prototype.addTo = function(cls) {
	var meta = cls.get('meta');
	if (!meta[this.storeKey].some(this.equal, this)) {
		this.cls = meta.cls;
		meta[this.storeKey].push(this);
	}
};

SubSubMethodMeta.prototype.addAddonTo = function(addon, meta) {
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

SubSubMethodMeta.prototype.equal = function(other) {
	return this.sub1 == other.sub1 && this.sub2 == other.sub2 && this.sub3 == other.sub3;
};

SubSubMethodMeta.prototype.strictEqual = function(other) {
	return this.equal(other) && this.cls === other.cls;
};

SubSubMethodMeta.prototype.init = function(self, name) {
	var sub1 = this.sub1;
	// 记录下来，render时从__subSubMethodsMap获取信息
	if (!self.__subSubMethodsMap[sub1]) {
		self.__subSubMethodsMap[sub1] = [];
	}
	self.__subSubMethodsMap[sub1].push(this);
};

this.exports = function(uiModule) {
	uiModule.decorators.push(subsubmethod);
};

});
