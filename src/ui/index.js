object.define('ui/index.js', [
		'string',
		'dom',
		'events',
		'./metas/component',
		'./metas/option',
		'./metas/request',
		'./metas/eventmethod',
		'./metas/onevent',
		'./metas/submethod',
		'./metas/subsubmethod',
		'./aop',
		'./net',
		'./options',
		'./components',
		'./addon',
		'./page'
		], function(require, exports) {

var string = require('string');
var dom = require('dom');
var events = require('events');
var aop = require('./aop');
var net = require('./net');
var optionsmod = require('./options');
var componentmeta = require('./metas/component');
var componentsmod = require('./components');

this.define = componentmeta.define;
this.define1 = componentmeta.define1;
this.parent = componentmeta.parent;
this.option = require('./metas/option').option;
this.eventmethod = require('./metas/eventmethod').eventmethod;
this.request = require('./metas/request').request;
this.onevent = require('./metas/onevent').onevent;
this.submethod = require('./metas/submethod').submethod;
this.subsubmethod = require('./metas/subsubmethod').subsubmethod;

this.decorators = [exports.eventmethod, exports.subsubmethod, exports.submethod, exports.onevent];

var globalid = 0;

function extend(src, target, ov) {
	for (var name in target) {
		if (src[name] === undefined || ov !== false) {
			src[name] = target[name];
		}
	}
	return src;
}

/**
 * 获取node节点已经被type包装过的实例
 */
this.getComponent = function(node, type) {
	var comp ;
	;(node.components || []).some(function(component) {
		// 用instanceOf判断，而不要通过gid
		// 在多个use下gid有可能重复，可能会找到错误的对象
		if (Class.instanceOf(component, type)) {
			comp = component;
			return true;
		}
	});
	return comp;
}

/**
 * 用于存放每个Component的信息
 */
function RuntimeMeta(cls) {
	// 此meta所在的component
	this.cls = cls;
	// 所有元素引用
	this.components = [];
	// 所有选项
	this.options = [];
	// 所有onXxx形式注册事件方法
	this.onEvents = [];
	// 所有xxx_xxx形式方法
	this.subMethods = [];
	// 所有xxx_xxx_xxx形式方法
	this.subSubMethods = [];
}

RuntimeMeta.prototype.addComponent = function(name) {
	if (this.components.indexOf(name) == -1) {
		this.components.push(name);
		return true;
	}
	return false;
};

RuntimeMeta.prototype.addOption = function(name) {
	if (this.options.indexOf(name) == -1) {
		this.options.push(name);
		return true;
	}
	return false;
};

/**
 * Component的metaclass
 */
this.ComponentClass = new Class(Type, function() {

	this.initialize = function(cls, name, base, dict) {
		var gid = globalid++;
		var memberSetter = cls.get('setMember');
		var meta = new RuntimeMeta(cls);
		var defaultOptions = {};

		cls.set('gid', gid);
		cls.set('meta', meta);
		cls.set('addons', []);
		cls.set('defaultOptions', defaultOptions);

		// 处理定义的成员
		Object.keys(dict).forEach(function(name) {
			var member = dict[name];
			var memberMeta = member? member.meta : null;
			if (name.slice(0, 2) == '__') {
				return;
			}

			// 生成meta.defaultOptions
			// 从meta中获取defaultOptions属性并合并到此组件的meta.defaultOptions中
			// 组件并不支持实例产生后同步其类的修改，因此meta.defualtOptions只在类的初始化函数中合并一次即可
			// 不需要在__setattr__中调用
			if (memberMeta && memberMeta.defaultOptions) {
				Object.keys(memberMeta.defaultOptions).forEach(function(key) {
					defaultOptions[name + '.' + key] = memberMeta.defaultOptions[key];
				});
			}

			memberSetter(name, member);
		});

		// 合并base的meta
		if (base != Object) {
			cls.get('mixBase')(base);
		}

		// 合并mixin的meta
		var mixer = cls.get('mixAddon');
		;(cls.__mixins__ || []).forEach(function(mixin) {
			// mixin的有可能不是addon
			if (!mixin.get('gid')) {
				return;
			}
			// 自己的addon
			if (cls.addAddon(mixin)) {
				// mixer 中 mix addon 的 addon
				mixer(mixin);
			}
		});

		// 生成Components
		cls.get('makeComponents')(name, base, dict);
	};

	this.__setattr__ = function(cls, name, member) {
		Type.__setattr__(cls, name, member);
		cls.get('setMember')(name, member);
	};

	/**
	 * 处理每一个component的成员
	 */
	this.setMember = function(cls, name, member) {
		var meta = cls.get('meta');
		var gid = cls.get('gid');

		if (!member) {
			return;

		}
		else if (member.meta) {
			member.meta.addTo(cls, name, member);

		}
		else {
			exports.decorators.forEach(function(decorator) {
				var newMember = decorator(name)(member);
				if (newMember) {
					newMember.meta.addTo(cls, name, member);
				}
			});
		}
	};

	/**
	 * 将base中的meta信息合并到cls
	 */
	this.mixBase = function(cls, base) {
		var meta = cls.get('meta');
		var oMeta = base.get('meta');

		// 合并addon
		base.get('addons').forEach(cls.addAddon, cls);

		// 合并defaultOptions
		extend(cls.get('defaultOptions'), base.get('defaultOptions'), false);

		// 合并components
		oMeta.components.forEach(meta.addComponent, meta);

		// 合并options
		oMeta.options.forEach(meta.addOption, meta);

		// 合并onevent
		oMeta.onEvents.forEach(function(onEventMeta) {
			onEventMeta.addTo(cls);
		});

		// 合并submethod
		oMeta.subMethods.forEach(function(subMethodMeta) {
			subMethodMeta.addTo(cls);
		});

		// 合并subsubmethod
		oMeta.subSubMethods.forEach(function(subSubMethodMeta) {
			subSubMethodMeta.addTo(cls);
		});
	};

	this.mixAddon = function(cls, addon) {
		var meta = cls.get('meta');
		var oMeta = addon.get('meta');

		// 合并addon的addon
		addon.get('addons').forEach(cls.addAddon, cls);

		// 合并addon的defaultOptions
		extend(cls.get('defaultOptions'), addon.get('defaultOptions'), false);

		// 合并addon的components
		oMeta.components.forEach(meta.addComponent, meta);

		// 合并addon的options
		oMeta.options.forEach(meta.addOption, meta);

		// 合并addond哦onEvents
		oMeta.onEvents.forEach(function(onEventMeta) {
			onEventMeta.addAddonTo(addon, meta);
		});

		// 合并addon的submethod
		oMeta.subMethods.forEach(function(subMethodMeta) {
			subMethodMeta.addAddonTo(addon, meta);
		});

		// 合并addon的subsubmethod
		oMeta.subSubMethods.forEach(function(subSubMethodMeta) {
			subSubMethodMeta.addAddonTo(addon, meta);
		});

	};

	/**
	 * 生成Components
	 */
	this.makeComponents = function(cls, name, base, dict) {
		// Component则是Array，其他则是父类上的Components
		var compsBase = base.Components || Array;

		cls.set('Components', new componentsmod.ComponentsClass(compsBase, function() {

			this.initialize = function(self, nodes, options) {
				// an empty Components
				if (!nodes) {
					return;
				}
				self._node = nodes;
				self._node.forEach(function(node) {
					var comp = exports.getComponent(node, cls) || new cls(node, options);
					self.push(comp);
				});
			};

			Object.keys(dict).forEach(function(name) {
				var member = dict[name];
				if (name == '__metaclass__' || name == 'initialize') {
					return;
				}
				// only method, filter field and class
				if (typeof member != 'function' || Class.instanceOf(member, Type)) {
					return;
				}

				this[name] = member;
			}, this);
		}));

	};

});

/**
 * UI模块基类，所有UI组件的基本类
 */
this.Component = new exports.ComponentClass(function() {

	this.__mixins__ = [optionsmod.Options];

	/**
	 * @param {HTMLElement} node 包装的节点
	 * @param {Object} options 配置
	 */
	this.initialize = function(self, node, options) {
		// 可能是mixin addon
		if (!node) {
			return;
		}

		// 存储make的新元素
		self.__rendered = []; // 后来被加入的，而不是首次通过selector选择的node的引用
		// 存储所有注册的事件
		self.__events = [];
		// 记录本comp上的subMethods已经被注册到了哪些sub comp上
		self.__bounds = [];
		// 记录所有aop
		self.__signals = [];

		self._node = dom.wrap(node);

		if (!self._node.components) {
			self._node.components = [];
		}
		self._node.components.push(self);

		// 做同继承链的检测
		var lastType = self._node.componentType;
		if (!lastType) {
			self._node.componentType = self.__class__;
		} else if (Class.getChain(lastType).indexOf(self.__class__) != -1) {
		} else if (Class.getChain(self.__class__).indexOf(lastType) != -1) {
			self._node.componentType = self.__class__;
		} else {
			if (typeof console != 'undefined') {
				console.warn('node has already wrapped, auto changed to virtual mode.');
			}
			// 在virtual模式下，所有涉及到self._node触发事件的特性都不会有
			// 包括：
			// option（会触发change事件）
			// handle（会触发同名事件），但handle在此阶段已经无法控制了，只能要求开发者限制其使用
			// onEvent（会为自己绑定事件）
			self.__virtual = dom.wrap(document.createElement('div'));
		}

		// 限定wrapper
		if (self.allowTags && !self.allowTags.some(function(tag) {
			// get('tagName') 返回的永远大写
			return tag.toUpperCase() == self._node.get('tagName');
		})) {
			if (typeof console != 'undefined') {
				console.error('just allow ' + self.allowTags + ' tags.');
			}
			return;
		}

		// 记录已经获取完毕的components
		var inited = 0;
		function checkInit() {
			if (inited == self.meta.components.length) {
				inited = -1; // reset
				// 初始化addons
				self.addons.forEach(function(addon) {
					addon.get('_init')(self);
				}); 
				self.init();
			}
		}

		// 存储subMethods，用于render时获取信息
		self.__subMethodsMap = {};
		// 初始化subMethodsMap
		self.meta.subMethods.forEach(function(meta) {
			meta.init(self, name);
		});

		// 存储subSubMethods，用于render时获取信息
		self.__subSubMethodsMap = {};
		// 初始化subSubMethodsMap
		self.meta.subSubMethods.forEach(function(meta) {
			meta.init(self, name);
		});

		if (!self.__virtual) {
			// 初始化options事件
			self.meta.options.forEach(function(name) {
				self.getMeta(name).bindEvents(self, name);
			});

			// 初始化onEvents
			self.meta.onEvents.forEach(function(meta) {
				meta.bindEvents(self);
			});
		}

		// 初始化options
		self._options = {};
		options = options || {};
		extend(options, self.defaultOptions, false);
		// 生成option在组件上的初始引用
		self.meta.options.forEach(function(name) {
			self.getOption(name);
		});
		// 设置所有传进来的option
		self.setOption(options);

		// 初始化自己身上的aop方法
		self.meta.subMethods.forEach(function(meta) {
			var sub = meta.sub1;
			var type = meta.sub2;
			var member = self[sub];
			if (typeof member == 'function') {
				self.addAspectTo(self, sub, type, meta.fullname);
			}
		});

		// 初始化components
		self.meta.components.forEach(function(name) {
			self.getMeta(name).select(self, name, null, function(comp) {
				inited++;
				checkInit();
			});
		});

		checkInit();
	};

	this.addAddon = classmethod(function(cls, addon) {
		var addons = cls.get('addons');
		if (addons.indexOf(addon) == -1) {
			addons.push(addon);
			return true;
		}
		return false;
	});

	/**
	 * 统一的aop注册入口
	 */
	this.addAspectTo = function(self, comp, originName, aopType, methodName) {
		var advice = (aopType == 'around') ? function(origin) {
			// 返回一个绑定后的origin
			return self[methodName](function() {
				return origin.apply(comp, arguments);
			});
		} : self[methodName];
		var signal = aop[aopType](comp, originName, advice, true);
		signal.comp = comp;
		// 记录自己给别人添加的aop方法
		self.__signals.push(signal);
	};

	/**
	 * 统一的注册事件入口，当一个组件需要给自己或其子成员注册事件时使用
	 * 统一入口可统一记录所有事件注册，在destroy时统一清除
	 */
	this.addEventTo = function(self, comp, type, func, cap) {
		comp.addEvent(type, func, cap);
		var item = {
			comp: comp,
			type: type,
			func: func,
			cap: cap
		};
		// 记录自己给别人添加的事件
		self.__events.push(item);
	};

	this.fireEvent = function(self) {
		return (self.__virtual || self._node).fireEvent.apply(self._node, Array.prototype.slice.call(arguments, 1));
	};

	this.addEvent = function(self) {
		return (self.__virtual || self._node).addEvent.apply(self._node, Array.prototype.slice.call(arguments, 1));
	};

	this.removeEvent = function(self) {
		return (self.__virtual || self._node).removeEvent.apply(self._node, Array.prototype.slice.call(arguments, 1));
	};

	this.show = function(self) {
		return self._node.show();
	};

	this.hide = function(self) {
		return self._node.hide();
	};

	/**
	 * 根据模板和选项生成一个节点
	 */
	this.createNode = function(self, template, data) {
		if (!template) {
			console.error('no template specified for ' + name + '.');
			return null;
		}
		var extendData = {};
		self.meta.options.forEach(function(name) {
			extendData[name] = self.get(name);
		});
		extend(data, extendData);
		var result = string.substitute(template, data);
		var node = dom.Element.fromString(result);

		return node;
	};

	this._init = function(self) {
	};

	/**
	 * 弹出验证错误信息
	 */
	this._invalid = function(self, msg) {
		if (!msg) msg = '输入错误';
		alert(msg);
	};

	/**
	 * 弹出出错信息
	 */
	this._error = function(self, msg) {
		if (!msg) msg = '出错啦！';
		alert(msg);
	};

	/**
	 * 重置组件
	 * 所有渲染出来的节点会被删除
	 * 所有注册的事件会被移除
	 */
	this._destroy = function(self) {

		// 删除所有render的元素
		self.__rendered.forEach(function(node) {
			node.dispose();
		});
		self.__rendered.splice(self.__rendered.length);

		// 清除所有注册的事件
		self.__events.forEach(function(item) {
			item.comp.removeEvent(item.type, item.func, item.cap);
		});
		self.__events.splice(self.__events.length);

		// 清除所有aop包装
		self.__signals.forEach(function(signal) {
			signal.remove();
		});
		self.__signals.splice(self.__signals.length);

		// 将node上保存的自己的引用删掉
		// 恢复self包装过node的所有痕迹
		self._node.components.splice(self._node.components.indexOf(self), 1);
	};

	this.destroyComponent = function(self, comp) {
		// 清除self注册给comp的事件
		self.__events.forEach(function(item) {
			if (item.comp === comp) {
				item.comp.removeEvent(item.type, item.func, item.cap);
			}
		});

		// 清除self注册给comp的aop方法
		self.__signals.forEach(function(signal) {
			if (signal.comp === comp) {
				signal.remove();
			}
		});

		// destroy后，所有的self注册给其的事件已经清除，将其从__bounds中删除
		self.__bounds.splice(self.__bounds.indexOf(comp), 1);
	};

	/**
	 * 清空自身节点
	 */
	this._dispose = function(self) {
		// virtual mode 无法触发事件，因此不执行dispose操作
		if (!self.__virtual) {
			self._node.dispose();
			self.fireEvent('afterdispose');
			self.destroy();
		}
	};

	/**
	 * 获取一个通过ui.request定义的net.Request的实例
	 */
	this.getRequest = function(self, name, data) {
		var pname = '_' + name;
		var options = self.getOption(name) || {};
		if (data) {
			options = object.clone(options);
			options.url = string.substitute(options.url, data);
		}
		var request;
		if (!self[pname]) {
			request = new net.Request();
			self.getMeta(name).bindEvents(self, name, request);
			self[pname] = request;
		} else {
			request = self[pname];
		}
		request.setOption(options);
		self._set(name, request);
		return request;
	};

	/**
	 * 设置获取到的component
	 */
	this.setComponent = function(self, name, comp) {
		var node = comp? comp._node : null;
		self._set(name, comp);
		self._set('_' + name, node);
	};

	/**
	 * 获取成员的meta信息
	 */
	this.getMeta = classmethod(function(cls, name) {
		var meta;
		var member = cls.get(name, false);

		if (!member) {
			return null;
		}

		if (member.__class__ == property) {
			meta = member.meta;
		}
		else if (typeof member == 'function') {
			meta = member.im_func.meta;
		}
		else {
			meta = null;
		}

		return meta;
	});

	/**
	 * 渲染一组component，渲染后执行callback
	 * @param {String} name 子component名字
	 * @param {Object} data 模板数据/初始化参数
	 * @param {Function} callback render结束后的回调
	 */
	this.render = function(self, name, data, callback) {
		// data可选
		if (!callback && typeof data == 'function') {
			callback = data;
			data = null;
		}

		var metaOptions = self.getOption(name + '.meta');
		var meta = self.getMeta(name);

		meta.getType(metaOptions, function(type) {

			// 如果已经存在结构了，则不用再render了
			// 需要确保这个get是同步的，因此在getType后执行
			var comp = self.get(name);
			if (comp && (!('length' in comp) || comp.length != 0)) {
				if (callback) {
					callback();
				}
				return;
			}

			var methodName = '__render_' + name;
			var renderer = self[methodName];
			if (!renderer) {
				console.error('no renderer specified for ' + name + '.');
				return;
			}

			// data
			data = data || {};
			var options = self._options[name];
			extend(data, options, false);

			meta.getTemplate(metaOptions, self.__class__.__module__, function(template) {
				var made = [];
				// make方法仅仅返回node，这样在new comp时node已经在正确的位置，parent可以被正确的查找到
				function make(newData) {
					var node = self.createNode(template, newData || data);
					made.push(node);
					self.__rendered.push(node);
					return node;
				};

				// for debug
				make.template = template;
				make.data = data;

				// made用在free component的定义
				var returnMade = renderer.call(self, make, data);
				if (returnMade) {
					made = returnMade;
				}

				meta.select(self, name, made);

				if (callback) {
					callback();
				}

			});
		});
	};

	/**
	 * 获取包装的节点
	 */
	this.getNode = function(self) {
		return self._node;
	};

});

this.Page = require('./page').Page;
this.AddonClass = require('./addon').AddonClass;

});

