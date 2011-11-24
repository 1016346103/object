object.add('events', 'ua', function(exports, ua) {

function IEEvent() {

}
IEEvent.prototype.stopPropagation = function() {
	this.cancelBubble = true;
};

IEEvent.prototype.preventDefault = function() {
	this.returnValue = false;
};

IEEvent.prototype.getPreventDefault = function() {
	// 自定义事件是没有 returnValue 值的，如果设置默认为true，则会导致非自定义的事件后面再设置false失效，出现无法preventDefault()的问题
	// 不能设置默认值，就只能严格限制returnValue === false才算preventDefaulted
	return this.returnValue === false;
};

IEEvent.prototype.stop = function() {
	this.stopPropagation();
	this.preventDefault();
};

/**
 * decorator
 * 使得相应方法在调用时fire出同名事件，并支持preventDefault
 * fireevent 或 fireevent(eventName)
 * fireevent 默认eventName通过__name__获得
 */
this.fireevent = function(arg1) {
	var name, func, eventDataNames;

	// 千万别给这个function起名字，否则fire出来的事件都叫一个名字
	var firer = function(self) {
		// 获取function原生name似乎没什么用
		// var nativeName = Function.__get_name__(arguments.callee) || arguments.callee.__name__;
		var nativeName = arguments.callee.__name__;
		if (!name) name = nativeName;

		// 根据eventDataNames生成eventData，每一个参数对应一个eventData
		var eventData = {};
		// 保存func被调用时的所有参数（除了self）
		var args = Array.prototype.slice.call(arguments, 1);
		if (eventDataNames) {
			for (var i = 0; i < eventDataNames.length; i++) {
				// 名字对应方法的参数，从第2个参数开始，因为第一个是self
				eventData[eventDataNames[i]] = arguments[i + 1];
			}
		}
		// 默认有一个_args的data，
		eventData._args = args;

		var event = self.fireEvent(name, eventData, self);

		// 执行 xxx_createEvent 方法，可用于定制event
		var createEventMethod = self[nativeName + '_createEvent'];
		if (createEventMethod) {
			args.unshift(event);
			createEventMethod.apply(self, args);
		}

		// Webkit 使用 defaultPrevented
		// Gecko 使用 getPreventDefault()
		// IE 用 returnValue 模拟了 getPreventDefault
		var preventDefaulted = event.getPreventDefault? event.getPreventDefault() : event.defaultPrevented;
		if (!preventDefaulted) return func.apply(this, arguments);
	};

	if (typeof arg1 == 'function') {
		func = arg1;
		return firer;

	// 自定义了事件名称，返回一个decorator
	} else {
		if (Array.isArray(arguments[0])) {
			eventDataNames = arguments[0];
		} else {
			name = arg1;
			if (arguments[1]) eventDataNames = arguments[1];
		}
		return function(_func) {
			func = _func;
			return firer;
		};
	}

};

/**
 * 将IE中的window.event包装一下
 */
this.wrapEvent = function(e) {
	// 之前手贱在这里写了个 e.returnValue = true
	// 于是所有的事件都无法阻止执行了
	// IE可能只认第一次赋值，因为后面还是有重新把returnValue设置成false的

	e.target = e.srcElement;
	e.stopPropagation = IEEvent.prototype.stopPropagation;
	e.preventDefault = IEEvent.prototype.preventDefault;
	e.getPreventDefault = IEEvent.prototype.getPreventDefault;
	e.stop = IEEvent.prototype.stop;

	return e;
};

// native events from Mootools
var NATIVE_EVENTS = {
	click: 2, dblclick: 2, mouseup: 2, mousedown: 2, contextmenu: 2, //mouse buttons
	mousewheel: 2, DOMMouseScroll: 2, //mouse wheel
	mouseover: 2, mouseout: 2, mousemove: 2, selectstart: 2, selectend: 2, //mouse movement
	keydown: 2, keypress: 2, keyup: 2, //keyboard
	orientationchange: 2, // mobile
	touchstart: 2, touchmove: 2, touchend: 2, touchcancel: 2, // touch
	gesturestart: 2, gesturechange: 2, gestureend: 2, // gesture
	focus: 2, blur: 2, change: 2, reset: 2, select: 2, submit: 2, paste: 2, oninput: 2, //form elements
	load: 2, unload: 1, beforeunload: 2, resize: 1, move: 1, DOMContentLoaded: 1, readystatechange: 1, //window
	error: 1, abort: 1, scroll: 1 //misc
};

/**
 * 事件系统
 */
this.Events = new Class(function() {
	
	// 在标准浏览器中使用的是系统事件系统，无法保证nativeEvents在事件最后执行。
	// 需在每次addEvent时，都将nativeEvents的事件删除再添加，保证在事件队列最后，最后才执行。
	function moveNativeEventsToTail(self, type) {
		var boss = self.__boss || self;
		if (self.__nativeEvents && self.__nativeEvents[type]) {
			// 删除之前加入的
			boss.removeEventListener(type, self.__nativeEvents[type].run, false);
			// 重新添加到最后
			boss.addEventListener(type, self.__nativeEvents[type].run, false);
		}
	};

	function handle(self, type) {
		var boss = self.__boss || self;
		boss.attachEvent('on' + type, function(eventData) {
			var event = arguments.length > 1? eventData : exports.wrapEvent(window.event);
			var funcs = self.__eventListeners? self.__eventListeners[type] : null;
			if (funcs) {
				funcs.forEach(function(func) {
					try {
						func.call(self, event);
					} catch(e) {
					}
				});
			}
			var natives = self.__nativeEvents? self.__nativeEvents[type] : null;
			if (natives) {
				natives.forEach(function(func) {
					func.call(self, event);
				});
			}
		});
	}

	// 不同浏览器对onhandler的执行顺序不一样
	// 	  IE：最先执行onhandler，其次再执行其他监听函数
	// 	  Firefox：如果添加多个onhandler，则第一次添加的位置为执行的位置
	// 	  Chrome ：如果添加多个onhandler，最后一次添加的位置为执行的位置
	// 
	// Chrome的做法是符合标准的，因此在模拟事件执行时按照Chrome的顺序来进行
	//
	// 保证onxxx监听函数的正常执行，并维持onxxx类型的事件监听函数的执行顺序
	function addOnHandlerAsEventListener(self, type) {
		// 只有DOM节点的标准事件，才会由浏览器来执行标准方法
		if (type in NATIVE_EVENTS && self.nodeType == 1) return;

		var boss = self.__boss || self;
		var onhandler = self['on' + type], onhandlerBak = boss['__on' + type];
		// 如果onHandler为空，并且已经添加过，则需要remove
		if (!onhandler && onhandlerBak) {
			boss.removeEventListener(type, onhandlerBak, false);
			boss['__on' + type] = null;
		}
		// 如果onHandler不为空，则需要判断是否已经添加过
		else if (onhandler && onhandler != onhandlerBak) {
			// 如果已经添加过，则先去除原先添加的方法，再将新的方法加入，并更新备份信息
			boss.removeEventListener(type, onhandlerBak, false);
			// 将新的事件监听方法加入列表
			boss.addEventListener(type, onhandler, false);
			// 将新的事件监听方法备份
			boss['__on' + type] = onhandler;
		}
	}
	
	// IE下保证onxxx事件处理函数正常执行
	function attachOnHandlerAsEventListener(self, type) {
		// 只有DOM节点的标准事件，才会由浏览器来执行标准方法
		if (type in NATIVE_EVENTS && self.nodeType == 1) return;

		if (!self.__eventListeners) {
			self.__eventListeners = {};
		}
		if (!self.__eventListeners[type]) {
			self.__eventListeners[type] = [];
		}
		var funcs = self.__eventListeners[type];
		var l = funcs.length;
		var onhandler = self['on' + type], onhandlerBak = self['__on' + type];
		// 如果onHandler为空，并且已经添加过，则需要remove
		if (!onhandler && onhandlerBak) {
			for (var i = 0; i < l; i++) {
				if (funcs[i] == onhandlerBak) {
					funcs.splice(i, 1);
					break;
				}
			}
			self['__on' + type] = null;
		}
		// 如果onHandler不为空，则需要判断是否已经添加过
		else if (onhandler && onhandler != onhandlerBak) {
			// 如果已经添加过，则先去除原先添加的方法，再将新的方法加入，并更新备份信息
			for (var i = 0; i < l; i++) {
				if (funcs[i] == onhandlerBak) {
					funcs.splice(i, 1);
					break;
				}
			}
			// 将新的事件监听方法加入列表
			funcs.push(onhandler);
			// 将新的事件监听方法备份
			self['__on' + type] = onhandler;
		}
	}

	this.initialize = function(self) {
		if (!self.addEventListener) {
			// 在一些情况下，你不知道传进来的self对象的情况，不要轻易的将其身上的__eventListeners清除掉
			if (!self.__eventListeners) self.__eventListeners = {};
			if (!self.__nativeEvents) self.__nativeEvents = {};
		}
		// 自定义事件，用一个隐含div用来触发事件
		if (!self.addEventListener && !self.attachEvent) {
			self.__boss = document.createElement('div');
		}
	};

	/**
	* 添加事件
	* @method
	* @param type 事件名
	* @param func 事件回调
	* @param cap 冒泡
	*/
	this.addEvent = document.addEventListener? function(self, type, func, cap) {
		var boss = self.__boss || self;

		if (cap === null) cap = false;

		// 非IE不支持mouseleave/mouseenter事件
		// 在老base中大量使用了这个事件，支持一下
		if (!ua.ua.ie && type == 'mouseleave') {
			var ismouseleave = function(event, element) {
				var p = event.relatedTarget;
				while ( p && p != element ) try { p = p.parentNode; } catch(error) { p = element; }
				return p !== element;
			};
			var innerFunc = func;
			func = function(event) {
				var p = event.relatedTarget;
				while (p && p != self) try {
					p = p.parentNode;
				} catch (e) {
					p = self;
				}
				if (p !== self && innerFunc) innerFunc.call(self, event);
			};
			func.innerFunc = innerFunc;
			type = 'mouseout';
		}

		//处理onxxx类型的事件处理函数
		addOnHandlerAsEventListener(self, type);

		boss.addEventListener(type, func, cap);
		moveNativeEventsToTail(self, type);

	} : function(self, type, func) {
		var boss = self.__boss || self;

		// 存储此元素的事件
		var funcs;
		if (!self.__eventListeners) self.__eventListeners = {};
		if (!self.__eventListeners[type]) {
			funcs = [];
			self.__eventListeners[type] = funcs;
			if (!self.__nativeEvents || !self.__nativeEvents[type]) {
				handle(self, type);
			}
		} else {
			funcs = self.__eventListeners[type];
		}

		// 不允许两次添加同一事件
		if (funcs.some(function(f) {
			return f === func;
		})) return;

		attachOnHandlerAsEventListener(self, type);
		funcs.push(func);

	};

	/**
	* 添加系统事件，保证事件这些事件会在注册事件调用最后被执行
	* @method
	* @param type 事件名
	* @param func 事件回调
	*/
	this.addNativeEvent = document.addEventListener? function(self, type, func) {
		var boss = self.__boss || self;
		var natives;
		if (!self.__nativeEvents) self.__nativeEvents = {};
		if (!self.__nativeEvents[type]) {
			natives = [];
			self.__nativeEvents[type] = natives;
			self.__nativeEvents[type].run = function(event) {
				natives.forEach(function(func) {
					func.call(self, event);
				});
			};
			moveNativeEventsToTail(self, type);
		} else {
			natives = self.__nativeEvents[type];
		}
		natives.push(func);

	} : function(self, type, func) {
		var boss = self.__boss || self;
		var natives;
		if (!self.__nativeEvents) self.__nativeEvents = {};
		if (!self.__nativeEvents[type]) {
			natives = [];
			self.__nativeEvents[type] = natives;
			if (!self.__nativeEvents || !self.__eventListeners[type]) {
				handle(self, type);
			}
		} else {
			natives = self.__nativeEvents[type];
		}

		// 不允许两次添加同一事件
		if (natives.some(function(f) {
			return f === func;
		})) return;

		natives.push(func);
	};

	/**
	* 移除事件
	* @method
	* @param type 事件名
	* @param func 事件回调
	* @param cap 冒泡
	*/
	this.removeEvent = document.removeEventListener? function(self, type, func, cap) {
		var boss = self.__boss || self;

		boss.removeEventListener(type, func, cap);
	} : function(self, type, func, cap) {
		var boss = self.__boss || self;

		if (!self.__eventListeners) self.__eventListeners = {};
		var funcs = self.__eventListeners[type];
		if (!funcs) return;

		for (var i = 0; i < funcs.length; i++) {
			if (funcs[i] === func) {
				funcs.splice(i, 1); // 将这个function删除
				break;
			}
		}
	};

	var nativeFireEvent = document.dispatchEvent ? null : document.createElement('div').fireEvent;

	/**
	* 触发事件
	* obj.fireEvent('name', {
	* data: 'value'
	* });
	* @method
	* @param type 事件名
	* @param eventData 扩展到event对象上的数据
	*/
	this.fireEvent = document.dispatchEvent? function(self, type, eventData) {
		//fireEvent之前仍然需要检查onxxx类型的事件处理函数
		addOnHandlerAsEventListener(self, type);
		var boss = self.__boss || self;

		var event = document.createEvent('Event');
		event.initEvent(type, false, true);
		object.extend(event, eventData);

		// 火狐下通过dispatchEvent触发事件，在事件监听函数中抛出的异常都不会在控制台给出
		// see https://bugzilla.mozilla.org/show_bug.cgi?id=503244
		boss.dispatchEvent(event);
		return event;
	} : function(self, type, eventData) {
		if (!eventData) eventData = {};

		// 如果是DOM节点的标准事件，则由浏览器处理onxxx类型的事件处理函数即可
		// see http://js8.in/731.html
		if (type in NATIVE_EVENTS && self.nodeType == 1) {
			var event = exports.wrapEvent(document.createEventObject());
			object.extend(event, eventData);

			nativeFireEvent.call(self, 'on' + type, event);
			return event;
		}

		attachOnHandlerAsEventListener(self, type);
		var event = exports.wrapEvent(eventData);

		var funcs = self.__eventListeners[type];
		if (funcs) {
			for (var i = 0, j = funcs.length; i < j; i++) {
				if (funcs[i]) {
					try {
						funcs[i].call(self, event, true);
					} catch(e) {
					}
				}
			}
		}

		var natives = self.__nativeEvents[type];
		if (natives) {
			natives.forEach(function(func) {
				func.call(self, event);
			});
		}

		return event;
	};
});

});
