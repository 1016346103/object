object.add('net', 'dom', function($, dom) {

var ajaxProxies = this.ajaxProxies = {};

// 执行一个可跨域的ajax请求
// 跨域host必须有ajaxproxy.htm
// callback唯一参数返回 XMLHttpRequest 对象实例
var ajaxRequest = this.ajaxRequest = function(url, callback) {
	var tmpA = document.createElement('a');
	tmpA.href = url;
	var hostname = tmpA.hostname;

	if (hostname && (hostname != location.hostname)) {
		var xhr = null;
		if (ajaxProxies[hostname]) callback(ajaxProxies[hostname].getTransport());
		else {
			var iframe = document.createElement('iframe');
			iframe.style.display = 'none';
			XN.dom.ready(function() {
				document.body.insertBefore(iframe, document.body.firstChild);
				iframe.src = 'http://' + hostname + '/ajaxproxy.htm';
				if (iframe.attachEvent) {
					iframe.attachEvent('onload', function () {
						callback(iframe.contentWindow.getTransport());
						ajaxProxies[hostname] = iframe.contentWindow;
					});
				} else {
					iframe.onload = function () {
						callback(iframe.contentWindow.getTransport());
						ajaxProxies[hostname] = iframe.contentWindow;
					};
				}
			});
		}
	} else {
		if (window.ActiveXObject) {
			try {
				callback(new ActiveXObject('Msxml2.XMLHTTP'));
			} catch(e) {
				callback(new ActiveXObject('Microsoft.XMLHTTP'));
			}
		} else callback(new XMLHttpRequest());
	}
};

var Request = this.Request = new Class(function() {

	this.__init__ = function(self, options) {
		self.url = options.url || '';
		self.method = options.method || 'get';
		self.onSuccess = options.onSuccess;
		self.headers = {};
		self._xhr = null;
		self._params = null;
		self._signal = {
			send: false
		};

		ajaxRequest(self.url, function(xhr) {
			self._xhr = xhr;

			xhr.onreadystatechange = self.onStateChange.bind(self);

			if (self._signal.send) self._send();
		});
	};

	this.onStateChange = function(self) {
		var xhr = self._xhr;

		if (xhr.readyState == 4) {
			if (xhr.status === undefined || xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) {
				self.onSuccess(xhr);
			}
		}
	};

	this.send = function(self, params) {
		self._params = params;

		if (self._xhr) {
			self._send();
		} else {
			self._signal.send = true;
		}
	};

	this.setHeader = function(self, name, value) {
		self.headers[name] = value;
	};

	this._send = function(self) {
		var xhr = self._xhr;

		// open
		xhr.open(self.method, self.url, true);

		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

		// headers
		for (var name in self.headers) {
			xhr.setRequestHeader(name, self.headers[name]);
		}

		self._xhr.send(self._params);
	};

});

});

