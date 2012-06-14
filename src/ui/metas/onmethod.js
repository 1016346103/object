object.define('ui/metas/onmethod.js', function(require, exports) {

/**
 * 定义一个扩展向宿主元素定义事件的方法
 * @decorator
 */
function onmethod(name) {
	// 名子要匹配带有$后缀
	var match = name.match(/^on([a-zA-Z1-9]+)([\$0-9]*)$/);
	if (!match) {
		// 名字不匹配，返回的decorator返回空
		return function() {
			return null;
		};
	}
	var eventType = match[1];
	// 后面带的无用的东西，只是用来区分addon的
	var surfix = match[2];
	eventType = eventType.slice(0, 1).toLowerCase() + eventType.slice(1);
	return function(func) {
		func.meta = new OnMethodMeta(eventType, name);
		return func;
	};
};

function OnMethodMeta(eventType, fullname) {
	this.eventType = eventType;
	this.fullname = fullname;
}

OnMethodMeta.prototype.storeKey = 'onMethods';

OnMethodMeta.prototype.decorator = onmethod;

OnMethodMeta.prototype.addTo = function(cls) {
	var meta = cls.get('meta');
	if (!meta[this.storeKey].some(this.equal, this)) {
		this.cls = meta.cls;
		meta[this.storeKey].push(this);
	}
};

OnMethodMeta.prototype.addAddonTo = function(addon, meta) {
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

OnMethodMeta.prototype.strictEqual = function(other) {
	return this.equal(other) && this.cls === other.cls;
};

OnMethodMeta.prototype.equal = function(other) {
	return this.eventType == other.eventType;
};

OnMethodMeta.prototype.bindEvents = function(self) {
	var eventType = this.eventType;
	var methodName = this.fullname;

	self.addEventTo(self, eventType, function(event) {
		var args = [event];
		//将event._args pass 到函数后面
		if (event._args) {
			args = args.concat(event._args);
		}
		self[methodName].apply(self, args);
	});
};

this.exports = function(uiModule) {
	uiModule.decorators.push(onmethod);
};

});

