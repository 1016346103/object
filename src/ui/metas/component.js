object.define('ui/metas/component.js', 'ui, sys, urlparse, dom, ../memberloader', function(require, exports) {

var dom = require('dom');
var ui = require('ui');

/**
 * 帮助定义一个生成组件间联系的方法
 */
function defineComponent(meta) {
	function fget(self) {
		var name = prop.__name__;
		// select只处理查询，不处理放置到self。
		// 这里不能直接meta.select，而是确保options中的meta信息存在，需要用getMeta
		var meta = self.getMeta(name);
		meta.select(self, name);
		return self[name];
	}
	var prop = property(fget);
	prop.meta = meta;
	return prop;
}

/**
 * 为一个Component定义一个components引用
 * 用法：
 * MyComponent = new Class(ui.Component, {
 *	refname: ui.define('.css-selector', ui.menu.Menu, {
 *		clickable: true
 *	}, renderer)
 * });
 * 这样MyComponent实例的refname属性即为相对应selector获取到的节点引用
 * @param {String|false} selector css选择器
 * @param {Component|String} [type=Component] 构造类的引用或模块成员字符串
 * @param {Object} [options] 默认配置
 * @param {Function} [renderer] 渲染器
 */
function define(selector, type, options, renderer) {
	if (type && typeof type !== 'string' && !Class.instanceOf(type, Type)) {
		renderer = options;
		options = type;
		type = null;
	}
	if (options && typeof options != 'object') {
		renderer = options;
		options = null;
	}

	if (!type) type = ui.Component;
	return defineComponent(new ComponentsMeta(selector, type, options, renderer));
};

/**
 * 同define，不过是定义唯一引用的component
 * @param {String|false} selector css选择器
 * @param {Component|String} [type=Component] 构造类的引用或模块成员字符串
 * @param {Object} [options] 默认配置
 * @param {Function} [renderer] 渲染器
 */
function define1(selector, type, options, renderer) {
	if (type && typeof type !== 'string' && !Class.instanceOf(type, Type)) {
		renderer = options;
		options = type;
		type = null;
	}
	if (options && typeof options != 'object') {
		renderer = options;
		options = null;
	}

	if (!type) type = ui.Component;
	return defineComponent(new ComponentMeta(selector, type, options, renderer));
};

/**
 * 定义父元素的引用，将在Component构造时遍历父节点直到找到相同类型的Component
 * @param {Component} type
 */
function parent(type, options) {
	if (!type) {
		throw new Error('arguments error.');
	}

	var meta = new ComponentMeta(null, type, options, null);
	meta.parent = true;

	return defineComponent(meta);
};

function ComponentMeta(selector, type, options, renderer) {
	this.selector = selector;
	this.type = type;
	this.renderer = renderer;
	this.defaultOptions = options;

	// selector为false的free组件拥有默认renderer，创建即返回
	if (!renderer && this.selector === false) {
		this.renderer = function(self, make) {
			return make();
		};
	}
}

ComponentMeta.prototype.addTo = function(cls, name, member) {
	var meta = cls.get('meta');
	if (meta.addComponent(name)) {
		Type.__setattr__(cls, '__render_' + name, member.meta.renderer);
	}
};

/**
 * 获取组件类
 */
ComponentMeta.prototype.getType = function(metaOptions, callback) {

	if (!metaOptions) {
		metaOptions = {};
	}

	var meta = this;
	var type = metaOptions.type || this.type;
	var addons = metaOptions.addons;
	var cls;

	var memberloader = require('../memberloader');

	// async
	if (typeof type == 'string') {
		memberloader.load(type, function(cls) {
			meta.getAddonedType(cls, addons, callback);
		});
	}
	// class
	else if (Class.instanceOf(type, Type)) {
		cls = type;
		this.getAddonedType(cls, addons, callback);
	}
	// sync
	else if (typeof type == 'function') {
		cls = type();
		this.getAddonedType(cls, addons, callback);
	}
};

/**
 * 获取被addon过的组件类
 * @param cls 基类
 * @param addons addons字符串
 * @param calblack
 */
ComponentMeta.prototype.getAddonedType = function(cls, addons, callback) {
	if (!addons) {
		callback(cls);
		return;
	}

	var memberloader = require('../memberloader');

	memberloader.load(addons, function() {
		// 存储最终的被扩展过的组件
		var addoned;

		// 获取到的组件类
		addons = Array.prototype.slice.call(arguments, 0);

		// 根据addons的gid顺序拼成一个字符串，作为保存生成的组件的key
		var key = [];
		addons.forEach(function(addon) {
			key.push(addon.get('gid'));
		});
		key.sort();
		key = key.join();

		// 之前已经生成过
		addoned = cls.get('addoned$' + key);

		// 没有生成过
		if (!addoned) {
			// 把生成的类保存在原始类上，用addons的gid的集合作为key
			addoned = new Class(cls, {__mixins__: addons});
			cls.set('addoned$' + key, addoned);
		}
		callback(addoned);
	});
};

/**
 * 将生成或查询到的node用type进行包装
 */
ComponentMeta.prototype.wrap = function(self, name, node, type) {
	var comp = ui.getComponent(node, type);

	// 此node已经被type类型包装过
	if (comp) {
		this.register(self, name, comp);
	}
	// 一个未被type包装过的node
	else {
		comp = new type(node, self._options[name]);
		this.bindEvents(self, name, comp);
		self.addEventTo(comp, 'afterdispose', function() {
			// 重新获取其引用
			self.getMeta(name).select(self, name);
		});
		self.addEventTo(comp, 'destroy', function() {
			self.destroyComponent(comp);
		});
	}

	return comp;
};

/**
 * 将查询到的comp用type进行包装
 */
ComponentMeta.prototype.register = function(self, name, comp) {
	this.bindEvents(self, name, comp);
	// 重新搜索，更新其options
	comp.setOption(self._options[name]);
};

/**
 * 将生成的comp设置到self上，并执行callback
 */
ComponentMeta.prototype.setComponent = function(self, name, comp, callback) {
	self.setComponent(name, comp);
	if (callback) {
		callback(comp);
	}
};

/**
 * 根据selector查询节点并进行包装，通过callback返回
 * @param self
 * @param name
 * @param made 如果selector为false，则需要指定节点是什么
 * @param callback
 */
ComponentMeta.prototype.select = function(self, name, made, callback) {

	var meta = this;
	var node;
	var metaOptions = self.getOption(name + '.meta') || {};
	var selector = metaOptions.selector || this.selector;
	var isParent = metaOptions.parent !== undefined? metaOptions.parent : this.parent;
	var isAsync = metaOptions.async !== undefined? metaOptions.async : this.async;

	// async
	if (self[name] === undefined && isAsync) {
		meta.setComponent(self, name, null, callback);
		return;
	}

	if (isParent) {
		this.getType(metaOptions, function(type) {
			var node = self._node;
			var comp = null;
			while ((node = node.parentNode)) {
				if ((comp = ui.getComponent(node, type))) {
					break;
				}
			}

			if (comp) {
				meta.register(self, name, comp);
			}
			meta.setComponent(self, name, comp, callback);
		});

	} else {
		// 说明无所谓selector，生成什么就放什么就行
		// 在强指定selector为false时，忽略meta中配置的selector
		if (selector === false) {
			// 不应该是一组成员，却是数组
			if (Array.isArray(made)) {
				node = made[0];
			} else {
				node = made;
			}
		}
		// 重建引用，若render正常，刚刚创建的节点会被找到并包装
		else {
			if (typeof selector == 'function') {
				node = dom.wrap(selector(self));
			} else {
				node = self._node.getElement(selector);
			}

		}

		if (node) {
			this.getType(metaOptions, function(type) {
				var comp = meta.wrap(self, name, node, type);
				meta.setComponent(self, name, comp, callback);
			});

		} else {
			meta.setComponent(self, name, null, callback);
		}
	}

};

/**
 * @param relativeModule 类所在的模块名，用来生成相对路径
 */
ComponentMeta.prototype.getTemplate = function(metaOptions, relativeModule, callback) {
	if (!metaOptions) {
		metaOptions = {};
	}

	var sys = require('sys');
	var urlparse = require('urlparse');
	var templatemodule = metaOptions.templatemodule || this.templatemodule;
	var template = metaOptions.template || this.template;

	var base;
	// 是相对路径 && 能找到此类的所在模块信息 && 在sys.modules中有这个模块
	if (templatemodule && (templatemodule.indexOf('./') === 0 || templatemodule.indexOf('../') === 0) && relativeModule && sys.modules[relativeModule]) {
		base = sys.getModule(relativeModule).id;
		templatemodule = urlparse.urljoin(base, templatemodule);
	}
	if (templatemodule) {
		require.async(templatemodule, function(module) {
			callback(module);
		});
	} else {
		callback(template);
	}

};

ComponentMeta.prototype.bindEvents = function(self, name, comp) {

	if (!comp) {
		return;
	}

	// comp可能会注册来自多个引用了它的其他的comp的事件注册
	// 通过在__bounds中保存已经注册过的其他组件，避免重复注册
	if (self.__bounds.indexOf(comp) != -1) {
		return;
	} else {
		self.__bounds.push(comp);
	}

	;(self.__subSubMethodsMap[name] || []).forEach(function(aopMeta) {
		var fullname = aopMeta.fullname;
		var originName = aopMeta.sub2;
		var aopType = aopMeta.sub3;
		if (comp[originName]) {
			self.addAspectTo(comp, originName, aopType, fullname);
		}
	});

	;(self.__subMethodsMap[name] || []).forEach(function(meta) {
		var fullname = meta.fullname;
		var type = meta.sub2;
		self.addEventTo(comp, type, function(event) {
			event.targetComponent = comp;
			var args;
			// 将event._args pass 到函数后面
			if (event._args) {
				args = [event].concat(event._args);
				self[fullname].apply(self, args);
			} else {
				self[fullname](event);
			}
		});
	});

};

function ComponentsMeta(selector, type, options, renderer) {
	ComponentMeta.apply(this, arguments);
}

ComponentsMeta.prototype = new ComponentMeta();

ComponentsMeta.prototype.select = function(self, name, made, callback) {

	var selector = this.selector;
	var nodes = null, comps = null;
	var meta = this;
	var metaOptions = self.getOption(name + '.meta');

	// 说明无所谓selector，生成什么就放什么就行
	// 在强指定selector为false时，忽略options中配置的selector
	if (selector === false) {
		// 应该是一组成员，确是不是数组
		if (made && !Array.isArray(made)) {
			nodes = [made];
		} else {
			nodes = made;
		}
	}
	// 重建引用，若render正常，刚刚创建的节点会被找到并包装
	else {
		if (typeof selector == 'function') {
			nodes = selector(self);
			// 确保返回的是个dom.Elements
			if (nodes.constructor != dom.Elements) {
				if (!nodes.length) {
					nodes = [nodes];
				}
				nodes = new dom.Elements(nodes);
			}
		} else {
			nodes = self._node.getElements(selector);
		}
	}

	if (nodes) {
		// 返回的是数组，变成Elements
		// 避免重复包装
		// TODO 用addEvent避免重复包装的方法不优雅
		if (!nodes.addEvent) {
			nodes = new dom.Elements(nodes);
		}

		this.getType(metaOptions, function(type) {
			nodes.forEach(function(node) {
				meta.wrap(self, name, node, type);
			});
			comps = new type.Components(nodes);
			meta.setComponent(self, name, comps, callback);
		});

	} else {
		// 返回空Components而不是null
		comps = new ui.Component.Components();
		meta.setComponent(self, name, comps, callback);
	}

};

this.exports = function(uiModule) {
	uiModule.define1 = define1;
	uiModule.define = define;
	uiModule.parent = parent;
};

});
