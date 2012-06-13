object.define('ui/components.js', function() {

this.ComponentsClass = new Class(Type, function() {

	this.initialize = function(cls, name, base, dict) {

		Object.keys(dict).forEach(function(name) {
			var member = dict[name];
			// 暂时忽略setOption
			if (name == 'initialize' || name == 'setOption') return;
			cls.set(name, member);
		});
	};

	this.__setattr__ = function(cls, name, member) {
		cls.get('setMember')(name, member);
	};

	/*
	 * 制造包装后的方法，遍历调用所有子节点的同名方法
	 */
	this.makeMethod = function(cls, name) {
		// 重新包装，避免名字不同导致warning
		Type.__setattr__(cls, name, function(self) {
			var results = [];
			var args = Array.prototype.slice.call(arguments, 1);
			// 有可能是个空的Components
			if (self._node) {
				self._node.forEach(function(node, i) {
					// 将每个的执行结果返回组成数组
					var result = self[i][name].apply(self[i], args);
					results.push(result);
				});
			}
			return results;
		});
	};

	this.setMember = function(cls, name, member) {
		var newName;
		var makeMethod = cls.get('makeMethod');

		if (name == 'getNode') {
			Type.__setattr__(cls, name, member);
		}
		else if (name.slice(0, 1) == '_' && name.slice(0, 2) != '__' && name != '_set') {
			// xxx
			makeMethod(name.slice(1));
			// _xxx
			makeMethod(name);
		}
		else {
			makeMethod(name);
		}
	};

});

});
