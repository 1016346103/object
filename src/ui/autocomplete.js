object.add('ui.autocomplete', 'dom, ua, events, string, sys', function(exports, dom, ua, events, string, sys) {

	// 判断是否支持HTML5的datalist
	var supportHTML5DataList = document.createElement('datalist').options != null;

	/**
	 * 使得一个input元素能够自动提示
	 * @param {HTMLInputElement} input 输入域
	 * @return 经过dom包装后的input元素
	 */
	this.enable = function(input) {
		return new exports.AutoComplete(input);
	};

	/**
	 * 数据列表实现类，模拟HTML5的input元素的list属性
	 */
	this.AutoComplete = new Class(function() {

		/**
		 * 初始化方法，为input添加focus/blur/keydown/keyup事件，并监听data-list属性变化
		 */
		this.initialize = function(self, input) {
			if (typeof input == 'string') {
				input = dom.id(input);
			} else {
				dom.wrap(input);
			}

			// 如果支持list，而且input设置的list属性存在对应的datalist，则使用浏览器提供的自动提示
			if (supportHTML5DataList) {
				var datalist = input.getAttribute('list');
				if (datalist && document.getElementById(datalist)) {
					return input;
				}
			}

			// 获取焦点时显示列表
			input.addEvent('focus', function(e) {
				wrapDataListIfListExists(input, 'handleInputFocus', e);
			}, events.HOLD);

			// 获取焦点时显示列表
			input.addEvent('click', function(e) {
				wrapDataListIfListExists(input, 'handleInputClick', e);
			}, events.HOLD);

			// 焦点移除时隐藏列表
			input.addEvent('blur', function(e) {
				wrapDataListIfListExists(input, 'handleInputBlur', e);
			}, events.HOLD);

			// 键盘按键点击时的处理
			input.addEvent('keydown', function(e) {
				wrapDataListIfListExists(input, 'handleInputKeydown', e);
			}, events.HOLD);

			// keyup的时候才能正确处理字符输入
			input.addEvent('keyup', function(e) {
				wrapDataListIfListExists(input, 'handleInputKeyup', e);
			}, events.HOLD);

			return input;
		};

		/**
		 * 如果data-list属性存在，则利用AutoCompleteWrapper的方法来处理事件
		 * @param {HTMLInputElement} input 输入域
		 * @param {String} methodName AutoCompleteWrapper中用于处理对应事件类型的处理函数
		 * @param {Event}  e 事件对象
		 */
		function wrapDataListIfListExists(input, methodName, e) {
			var datalist = input.getAttribute('data-list');
			if (datalist) {
				// 如果没有_autocompleter属性，说明还没有包装过
				if (!input._autocompleter) {
					input._autocompleter = new AutoCompleteWrapper(input);
				}
				input._autocompleter[methodName](e);
			}
		}
	});	

	// 为container的id属性添加标识，区分同时存在的多个datalist容器
	var listIdCounter = 0;

	// 匹配模式设置，ALL为全部显示，FIRST为匹配首字母，ANY为匹配任意位置
	var MATCH = {
		ALL: 0,
		FIRST: 1,
		ANY: 2
	}

	// 一些默认设置
	var defaultOptions = {
		maxHeight: 220,           // 容器最大高度
		maxCharCount: 150,        // 最大字符数
		dynamicData: false,       // 数据是否动态获取
		matchMode: MATCH.ALL,     // 匹配模式
		clearWhenMouseout: false  // 是否在鼠标离开容器时去除已选择项的选中样式
	}

	// 定义键位与名称的映射
	var KEY = { UP: 38, DOWN: 40, DEL: 46, TAB: 9, ENTER: 13, ESC: 27, BACKSPACE: 8 };

    // 模板引擎使用的模板
	var TEMPLATES = {
		// 列表模板，每一次刷新列表都会渲染一次
		LIST : '<ul style="list-style:none;margin:0;padding:0;z-index:1998;position:relative;overflow:auto;zoom:1;">' + 
					'{{#data}}<li style="padding:2px 4px;font-size:12px;font-family:inherit;" real_value="{{value}}">{{text}}</li>{{/data}}' + 
			   '</ul>',
		// HTML模板，第一次新建div时渲染一次
		CONTAINER : 
			'<div id="datalistContainer{{index}}" style="border:1px solid gray;position:absolute;top:{{top}}px;left:{{left}}px;z-index:1998;background:#fff;font-size:small;zoom:1;">' +
				// ie6使用iframe遮挡select
				// 遇到的问题：只有一条记录的时候会出现滚动条 https://github.com/brandonaaron/bgiframe/blob/master/jquery.bgiframe.js
				'{{#ie6}}<iframe id="datalist_iframe" frameBorder="0" style="position:absolute;z-index:2;top:0px;left:0px;overflow:hidden;display:block;filter:Alpha(Opacity=0);" src="javascript:false;"></iframe>{{/ie6}}' + 
			'</div>'
	};


	/**
	 * datalist的封装类，所有datalist的操作都由此类完成
	 * 将此类与AutoComplete类分离开，减少往input上添加的不必要的属性
	 */
	var AutoCompleteWrapper = new Class(function() {

		/**
		 * 初始化方法，主要是禁用浏览器自带的自动提示、并初始化参数选项
		 * @param {HTMLInputElement} input 自动提示的输入域
		 */
		this.initialize = function(self, input) {
			// 保存对input的引用，用于控制，但是不为input添加新属性
			self.input = input;
			// 屏蔽浏览器默认的自动提示
			self.input.autocomplete = 'off';
			// 初始化参数
			self.initOptions();

			// 添加DOMNodeInserted事件监听，IE8及以下模拟此事件
			self.bindDOMNodeInsertEvent();

			self.relocateBinded = self.relocate.bind(self);
			self.hideBinded = self.hideDataList.bind(self);
		};

		/**
		 * 为list属性对应的datalist添加DOMNodeInserted事件监听，在添加节点后显示列表
		 */
		this.bindDOMNodeInsertEvent = function(self) {
			var datalist = dom.id(self.input.getAttribute('data-list'));
			if (!datalist) {
				reportError(datalist + ' 对应的datalist不存在');
				return;
			}

			// 从IE9开始支持DOMNodeInserted事件
			// http://help.dottoro.com/ljimhdto.php
			if (ua.ua.ie < 9) {
				// 模拟DOMNodeInsert事件的触发
				self.simulateDOMNodeInsertForIE(datalist);
			}

			// 监听DOMNodeInserted事件
			// 注意：在标准浏览器下，如果通过DocumentFragment向DOM节点添加子节点：
			//       每一个添加的子节点都会触发一次DOMNodeInserted事件
			datalist.addEvent('DOMNodeInserted', function(e) {
				// 如果有新节点加入，则将动态数据标志置为true
				self.options.dynamicData = true;
				// 只有当前输入域拥有焦点的情况下，才显示列表
				if (!self._shouldNotShow && self.input == self.input.ownerDocument.activeElement) {
					self.showDataList();
				}
			}, events.HOLD);
		};

		/**
		 * 在IE下模拟DOMNodeInserted事件
		 * 根据具体使用，暂替换appendChild和insertBefore
		 * @param {HTMLDataListElement} datalist datalist对象，事件由datalist发出
		 */
		this.simulateDOMNodeInsertForIE = function(self, datalist) {
			// 避免重复替换导致递归调用
			if (!datalist._oldAppendChild) {
				// 替换appendChild
				datalist._oldAppendChild = datalist.appendChild;
				datalist.appendChild = function(node) {
					datalist._oldAppendChild(node);
					datalist.fireEvent('DOMNodeInserted');
				};
				// 替换insertBefore
				datalist._oldInsertBefore = datalist.insertBefore;
				datalist.insertBefore = function(newNode, oldNode) {
					datalist._oldInsertBefore(newNode, oldNode);
					datalist.fireEvent('DOMNodeInserted');
				}
			}
		}

		/**
		 * 初始化options属性
		 * @param {Object} options 属性设置
		 */
		this.initOptions = function(self, options) {
			self.options = object.extend(defaultOptions, options);
		}

		/**
		 * 让input获取焦点
		 */
		this.focusToInput = function(self) {
			// 在IE下，拖动列表容器滚动条时，如果不加setTimeout，则不会正确设置焦点
			setTimeout(function() {
				self.input.focusToPosition(self.input.value.length);
			}, 0);
		};

		/**
		 * 选择上一条记录
		 */
		this.selectPrevListItem = function(self) {
			var scrollIndex = 0, list = self._list, len = list.length, scrollIndex = len - 1;
			if (!self._highlighted) {
				self._highlighted = list[len - 1];
			} else {
				for(var i = 0; i < len; i++) {
					if (list[i] === self._highlighted) {
						removeSelectStyle(self._highlighted);
						self._highlighted = list[(i == 0 ? len - 1 : i - 1)];
						scrollIndex = (i == 0 ? len - 1 : i - 1);
						break;
					}
				}
			}
			addSelectStyle(self._highlighted);
			self.scrollToSelectedItem();
		};

		/**
		 * 选择下一条记录
		 */
		this.selectNextListItem = function(self) {
			var scrollIndex = 0, list = self._list;
			if (!self._highlighted) {
				self._highlighted = list[0];
			} else {
				var len = list.length;
				for(var i = 0; i < len; i++) {
					if (list[i] === self._highlighted) {
						removeSelectStyle(self._highlighted);
						self._highlighted = list[(i == len - 1 ? 0 : i + 1)];
						scrollIndex = (i == len - 1 ? 0 : i + 1);
						break;
					}
				}
			}
			addSelectStyle(self._highlighted);
			self.scrollToSelectedItem();
		};

		/**
		 * 控制滚动条滚动到选中的数据项上
		 * @param {int} index 选中项的索引
		 * @param {String} direction 按键的方向（up/down）
		 */
		this.scrollToSelectedItem = function(self) {
			var hasScroll = parseInt(self._ul.offsetHeight) < self._ul.scrollHeight;
			if (!hasScroll) {
				return;
			}
			var list = self._list,
				item = self._highlighted,
				itemPos = calculatePosition(item),
				listPos = calculatePosition(self._ul);

			var delta = itemPos.top - listPos.top;
			var scrolled = self._ul.scrollTop;
			var height = self._ul.offsetHeight;

			// 说明当前元素已经到了顶部以上
			if (delta < 0) {
				self._ul.scrollTop = scrolled + delta;
			}
			// 说明当前元素已经到达底部以下
		   	else if (delta > height - item.offsetHeight){
				self._ul.scrollTop = scrolled + delta - height + item.offsetHeight;
			}
		};

		/**
		 * 显示数据列表，每一次获取焦点时调用此方法显示数据
		 */
		this.showDataList = function(self) {
			self._shouldNotShow = false;
			var needRelocate = true;
			if (!self._container) {
				needRelocate = false;
				var pos = calculatePosition(self.input);
				var output = string.substitute(TEMPLATES.CONTAINER, {
					index : listIdCounter,
					ie6 : ua.ua.ie <= 6,
					top : pos.top + self.input.offsetHeight,
					left : pos.left
				});

				var node = dom.getDom(output);
				document.body.appendChild(node);
				self._container = dom.id('datalistContainer' + listIdCounter);
				self.bindEventForContainer();
				listIdCounter ++;
			}
			
			self.filterListItems();

			if (needRelocate) {
				self.relocate();
			}

			window.addEvent('resize', self.relocateBinded, events.HOLD);
			window.addEvent('scroll', self.hideBinded, events.HOLD);
		}

		/**
		 * 根据input中现有的输入内容，过滤数据列表项
		 */
		this.filterListItems = function(self) {
			var data = self.getListData();
			var value = self.input.value.trim();
			if (value != "") {
				value = value.toLowerCase();
				data = data.filter(function(ele) {
					// 判断过滤模式
					switch (self.options.matchMode) {
						case MATCH.ALL:
							return true;
						case MATCH.FIRST:
							return ele.value.toLowerCase().indexOf(value) == 0;
						case MATCH.ANY:
							return ele.value.toLowerCase().indexOf(value) != -1;
						default:
							return true;
					}
				});
			}

			// 利用模板引擎渲染html
			var ulHtml = string.substitute(TEMPLATES.LIST, {
				data: data
			});

			if (self._ul) {
				// 移除原有的
				self._container.removeChild(self._ul);
				self._ul = null;
			}
			// 加入新的
			var node = dom.getDom(ulHtml);
			self._container.appendChild(node);
			// 保存ul避免多次获取
			self._ul = dom.getElement('ul', self._container);
			self._list = dom.getElements('li', self._ul);

			if (data.length == 0) {
				self._container.style.display = 'none';
			} else {
				self._container.style.display = 'block';
				if (!self._liOffsetHeight) {
					self._liOffsetHeight = self._list[0].offsetHeight;
				}
				// 调整容器的显示
				self.adjustContainerDisplay();
			}
		}

		/**
		 * 调整容器的显示，比如高宽、ie6下iframe的高宽
		 */
		this.adjustContainerDisplay = function(self) {
			var ul = self._ul, 
				inputOffsetWidth = self.input.offsetWidth, 
				ulOffsetWidth = ul.offsetWidth,
				listHeight = ul.offsetHeight,
				isScrolled = listHeight > self.options.maxHeight;

			// 设置最大高度和最小宽度
			ul.style.maxHeight = self.options.maxHeight + 'px';
			ul.style.minWidth = inputOffsetWidth + 'px';
			// 如果有滚动条出现，还必须让出滚动条的宽度
			ul.style.width = ulOffsetWidth + (isScrolled ? 20 : 0) + 'px';

			// IE6宽度无论如何都是input的宽度
			if (ua.ua.ie != 6 && ulOffsetWidth < inputOffsetWidth) {
				ul.style.width = inputOffsetWidth + (isScrolled ? 20 : 0) + 'px';
			}

			if (ua.ua.ie <= 6) {
				// 调整IE的高和宽
				if (isScrolled) {
					ul.style.height = self.options.maxHeight + 'px';
				}

				// IE6下绝对定位的ul宽度有问题，直接赋值为input的宽度
				ul.style.width = inputOffsetWidth + 'px';

				// 调整IE6的遮挡iframe的高宽
				if (!self._iframe) {
					self._iframe = dom.getElement('#datalist_iframe', self._container);
				}
				self._iframe.style.width = self._container.offsetWidth - 2 + 'px';
				self._iframe.style.height = self._container.offsetHeight - 2 + 'px';
			}
		}

		/**
		 * 为容器绑定事件，为li做事件代理，包括mouseover/mouseout/mousedown/click<br>
		 * 点击滚动条不会mouseup，解决办法：通过监听下一次mousedown的位置来确定是否隐藏 参考jquery autocomplete
		 */
		this.bindEventForContainer = function(self) {
			var container = self._container;
			container.delegate('li', 'mouseover', function(e) {
				if (self._highlighted) {
					removeSelectStyle(self._highlighted);
				}
				var li = e.target;
				self._highlighted = li;
				addSelectStyle(li);
			}, events.HOLD);

			container.delegate('li', 'mouseout', function(e) {
				var li = e.target;
				var relatedTarget = e.relatedTarget;
				if (relatedTarget.tagName == 'LI' || self.options.clearWhenMouseout) {
					removeSelectStyle(self._highlighted);
					self._highlighted = null;
				}
			}, events.HOLD);

			/** 避免多次为document绑定mousedown而设置的标志，jquery使用的是event.one的机制 */
			self._bindedFlag = false;

			//绑定mousedow事件，由于点击滚动条时不会触发mouseup，因此监听下一次mousedown
			container.addEvent('mousedown', function(e) {
				self._clickOnContainer = true;
				self.focusToInput();
				if (!self._bindedFlag && isSubNode(e.target, self._container)) {
					self._bindedFlag = true;
					dom.wrap(document).addEvent('mousedown', function(e) {
						var target = e.target;
						if (target !== self && !isSubNode(target, self._container)) {
							self._bindedFlag = false;
							self._clickOnContainer = false;
							self.focusFromContainer = false;
							self.hideDataList();
							document.removeEvent('mousedown', arguments.callee, false);
						}
					}, events.HOLD);
				}
			}, events.HOLD);

			// 代理li的点击事件
			container.delegate('li', 'click', function(e) {
				self.selectListItem(e.target);
				self.focusFromContainer = true;
				self.hideDataList();
			}, events.HOLD);
		}

		/**
		 * 从datalist列表中获取数据，并且组织成json数据，以备模板引擎渲染使用
		 * @returns {Array} 数据列表，格式形如：{value:value, text:text} value是真实值，text是显示的值
		 * TODO 需要增加缓存以减少查询
		 */
		this.getListData = function(self) {
			if (!self.options.dynamicData && self.data) {
				return self.data;
			}
			// 获取datalist
			var datalistId = self.input.getAttribute('data-list');
			if (!datalistId) {
				reportError('不存在' + datalistId + '对应的datalist');
				return [];
			}
			var options = dom.getElements('#' + datalistId + ' option');
			if (options.length === 0) {
				//reportError('浏览器不支持datalist属性或不存在' + datalistId + '对应的datalist');
				return [];
			}
			var result = [];
			for (var i = 0, l = options.length, current, value; i < l; i++) {
				current = options[i];

				value = current.getAttribute('value') || current.value;
				if (value.trim().length == 0) {
					result[result.length] = {value:'', text:'&nbsp;'};
					continue;
				}
				if (value.trim().length > self.options.maxCharCount) {
					// 如果内容超长，则value是真实值，text是截断以后的值
					result[result.length] = {value:value,text:value.substring(0, self.options.maxCharCount - 3) + '...'};
				} else {
					result[result.length] = {value:value,text:value};
				}
			}
			if (!self.options.dynamicData) {
				self.data = result;
			}
			return result;
		}

		/**
		 * 处理input click
		 */
		this.handleInputClick = function(self) {
			if (!self.isDataListDisplayed() && !self.focusFromContainer) {
				self.showDataList();
			}
			if (self.focusFromContainer) {
				self.focusFromContainer = false;
			}
		};

		/**
		 * 处理input的焦点获取
		 */
		this.handleInputFocus = function(self) {
			if (!self.isDataListDisplayed() && !self.focusFromContainer) {
				self.showDataList();
			}
			if (self.focusFromContainer) {
				self.focusFromContainer = false;
			}
		};

		/**
		 * 处理input的焦点丢失
		 */
		this.handleInputBlur = function(self) {
			if (self._clickOnContainer) {
				self._clickOnContainer = false;
			} else {
				self.hideDataList();
			}
		};

		/**
		 * 处理input的keydown事件
		 * @param {Event} e 事件对象，用于获取keyCode
		 */
		this.handleInputKeydown = function(self, e) {
			if (!self.isDataListDisplayed()) {
				return;
			}
			var keyCode = e.keyCode;
			switch (keyCode) {
				case KEY.UP : 
					// 向上则选择上一条
					e.preventDefault();
					self.selectPrevListItem();
					break;
				case KEY.DOWN : 
					// 向下则选择下一条
					e.preventDefault();
					self.selectNextListItem();
					break;
				case KEY.ENTER : 
					// 回车则选择当前项，并且隐藏列表
					e.preventDefault();
					if (self._highlighted) {
						self.selectListItem(self._highlighted);
					}
					self.hideDataList();
					// 屏蔽表单的默认提交
					return false;
				case KEY.ESC : 
					// ESC键隐藏列表
					self.hideDataList();
					break;
				default:
					break;
			}
		};

		/**
		 * 处理input的keyup事件
		 * @param {Event} e 事件对象，用于获取keyCode
		 */
		this.handleInputKeyup = function(self, e) {
			var keyCode = e.keyCode;
			switch (keyCode) {
				case KEY.UP : 
				case KEY.DOWN : 
				case KEY.ENTER : 
				case KEY.ESC : 
					break;
				default:
					self._shouldNotShow = false;
					self._highlighted = null;
					self.filterListItems();
					break;
			};
		};

		/**
		 * 选择列表中的一项，并触发select事件
		 * @param {HTMLLIElement} li 选中的li项
		 */
		this.selectListItem = function(self, li) {
			var value = li.getAttribute('real_value');
			self.input.value = value;
			self.input.fireEvent('datalistItemSelected', {value:value});
			self._shouldNotShow = true;
		};

		this.relocate = function(self) {
			var pos = calculatePosition(self.input);
			self._container.style.left = pos.left + 'px';
			self._container.style.top = pos.top + self.input.offsetHeight + 'px';
		};

		/**
		 * 隐藏列表
		 */
		this.hideDataList = function(self) {
			if (self._container) {
				self._container.style.display = 'none';
				self._highlighted = null;
			}
			window.removeEvent('resize', self.relocateBinded, events.HOLD);
			window.removeEvent('scroll', self.hideBinded, events.HOLD);
		}

		/**
		 * 判断列表数据是否已经显示
		 * @returns {Boolean} 如果已经显示返回true，否则返回false
		 */
		this.isDataListDisplayed = function(self) {
			return self._container && self._container.style.display != 'none';
		}

		// 内部方法，为li元素添加选中的样式
		function addSelectStyle(li) {
			if (li) {
				li.oldBgColor = li.style.backgroundColor;
				li.style.backgroundColor = '#316AC5';
				li.oldColor = li.style.color;
				li.style.color = 'white';
				li.oldCursor = li.style.cursor;
				li.style.cursor = 'pointer';
			}
		}

		// 内部方法，为li元素移除选中的样式
		function removeSelectStyle(li) {
			if (li) {
				li.style.backgroundColor = li.oldBgColor;
				li.oldBgColor = null;
				li.style.color = li.oldColor;
				li.oldColor = null;
				li.style.cursor = li.oldCursor;
				li.oldCursor = null;
			}
		}

		function calculatePosition(ele){
			return getDOMLeftTop(ele);
		};

		// 参考mootools
		function getDOMLeftTop(ele) {
			if (ele.getBoundingClientRect){
				var bound = ele.getBoundingClientRect(),
				html = ele.ownerDocument.documentElement,
				scroll = {x:getScrollLeft(ele), y:getScrollTop(ele)},
				isFixed = (ele.style.position == 'fixed');
				return {
					left: parseInt(bound.left, 10) + ((isFixed) ? 0 : scroll.x) - html.clientLeft,
					top: parseInt(bound.top, 10) +  ((isFixed) ? 0 : scroll.y) - html.clientTop
				};
			}

			var element = ele, position = {left: 0, top: 0};
			if (ele.tagName == 'BODY') return position;

			while (element && element.tagName != 'BODY'){
				position.left += element.offsetLeft;
				position.top += element.offsetTop;

				if (ua.ua.gecko){
					if (!borderBox(element)){
						position.left += parseFloat(element.style.borderLeftWidth);
						position.top += parseFloat(element.style.borderTopWidth);
					}
					var parent = element.parentNode;
					if (parent && parent.style.overflow != 'visible'){
						position.left += parseFloat(parent.style.borderLeftWidth);
						position.top += parseFloat(parent.style.borderTopWidth);
					}
				} else if (element != ele && ua.ua.webket){
					position.left += parseFloat(element.style.borderLeftWidth);
					position.top += parseFloat(element.style.borderTopWidth);
				}

				element = element.offsetParent;
			}
			if (ua.ua.gecko && ele.style.MozBoxSizing != 'border-box'){
				position.left -= parseFloat(ele.style.borderLeftWidth);
				position.top -= parseFloat(ele.style.borderTopWidth);
			}
			return position;
		}

		function getScrollTop(ele) {
			if(document.documentElement && document.documentElement.scrollTop) {
				return document.documentElement.scrollTop;
			} else {
				return document.body.scrollTop;
			}
		}

		function getScrollLeft(ele) {
			if(document.documentElement && document.documentElement.scrollLeft) {
				return document.documentElement.scrollLeft;
			} else {
				return document.body.scrollLeft;
			}
		}

		// 内部方法，用于判断node是否是container的子节点
		function isSubNode(node, container) {
			var tagName = null;
			while(node) {
				tagName = node.tagName;
				if (tagName === 'BODY' || tagName === 'HTML') {
					return false;
				}
				if (node === container) {
					return true;
				}
				node = node.parentNode;
			}
			return false;
		}

		// 内部方法，将错误信息打印至控制台
		function reportError(msg) {
			if (typeof console != 'undefined' && console.error) {
				console.error(msg);
			}
		}
	});
});