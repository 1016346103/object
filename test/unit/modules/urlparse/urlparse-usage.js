module('urlparse-usage');

//python : scheme-netloc-path-params-query-fragment
var urlResultMap = {
	'http' : '[,,http,,,]',
//	'http:/': '[http,,/,,,]',
//	'http://' : '[http,,,,,]',
	'http://www' : '[http,www,,,,]',
	'http://www.renren' :  '[http,www.renren,,,,]',
	'http://www.renren.abc' : '[http,www.renren.abc,,,,]',
	'http://192.168' : '[http,192.168,,,,]',
	'http://192.168.1.1:abc' : '[http,192.168.1.1:abc,,,,]',
	'ftp://192.168.1.1:dd' : '[ftp,192.168.1.1:dd,,,,]',
	'aaa://192.168.1.1:dd' : '[aaa,192.168.1.1:dd,,,,]',
	'music': '[,,music,,,]',
	'music.renren' : '[,,music.renren,,,]',
	'&&&.renren.com' :  '[,,&&&.renren.com,,,]',
	'***.renren.com' :  '[,,***.renren.com,,,]',
	'http://www.renren.com' : '[http,www.renren.com,,,,]',
	'http://blog.renren.com' : '[http,blog.renren.com,,,,]',
	'http://www.renren.com/' : '[http,www.renren.com,/,,,]',
	'http://www.renren.com/home' : '[http,www.renren.com,/home,,,]',
	'http://www.renren.com/blog/0/addBlog' : '[http,www.renren.com,/blog/0/addBlog,,,]',
	'http://www.renren.com?id=3321321' : '[http,www.renren.com,,,id=3321321,]',
	'http://www.renren.com/home?id=3321321' : '[http,www.renren.com,/home,,id=3321321,]',
	'http://www.renren.com/home?id=31321321#//music/?from=homeleft' : 
		'[http,www.renren.com,/home,,id=31321321,//music/?from=homeleft]',
	'http://www.renren.com:8080/home?id=31321321#//music/?from=homeleft' : 
		'[http,www.renren.com:8080,/home,,id=31321321,//music/?from=homeleft]',
	'http://www.renren.com:8080/home?id=31321321&a=1#//music/?from=homeleft' : 
		'[http,www.renren.com:8080,/home,,id=31321321&a=1,//music/?from=homeleft]',
	'http://www.renren.com:8080/home;32131?id=31321321&a=1#//music/?from=homeleft' : 
		'[http,www.renren.com:8080,/home,32131,id=31321321&a=1,//music/?from=homeleft]',
	'http://www.renren.com:8080/home;32131?id=31321321&a=1#//music/?from=homeleft#fdalfdjal' :
		'[http,www.renren.com:8080,/home,32131,id=31321321&a=1,//music/?from=homeleft#fdalfdjal]',
	'https://www.renren.com' : '[https,www.renren.com,,,,]',
	'http://192.168.1.1' : '[http,192.168.1.1,,,,]',
	'http://192.168.1.1:80': '[http,192.168.1.1:80,,,,]',
	'ftp://192.168.1.1' : '[ftp,192.168.1.1,,,,]',
	'ftp://192.168.1.1:80' : '[ftp,192.168.1.1:80,,,,]',
	'ftp://www.renren.com' : '[ftp,www.renren.com,,,,]',
	'file:///F:/works/workspace/objectjs.org/object/test/unit/modules/urlparse/index.html':
		'[file,,/F:/works/workspace/objectjs.org/object/test/unit/modules/urlparse/index.html,,,]',
	'music.renren.com' : '[,,music.renren.com,,,]',
	'music.renren.com/musicbox?from=homeleft' : '[,,music.renren.com/musicbox,,from=homeleft,]',
	'www.renren.com/home?id=31321321#//music/?from=homeleft' : 
		'[,,www.renren.com/home,,id=31321321,//music/?from=homeleft]'
};
test('urlparse.urlparse : usage', function() {
	object.use('urlparse', function(exports, urlparse) {
		for(var prop in urlResultMap) {
			var parts = urlparse.urlparse(prop);
			equal('['+parts.join(',')+']', urlResultMap[prop], prop);
		}
	});
});

test('urlparse.urlunparse : usage', function() {
	object.use('urlparse', function(exports, urlparse) {
		for(var prop in urlResultMap) {
			if (prop == 'http:/') continue;
			var parts = urlResultMap[prop];
			var partsArray = eval('(' + 
				parts.replace(/,/g, '\',\'').replace(/^\[/, '\[\'').replace(/\]$/, '\'\]')+ ')');
			var url = urlparse.urlunparse(partsArray);
			equal(url, prop, prop);
		}
	});
});

test('urlparse.urljoin : usage', function() {
	object.use('urlparse', function(exports, urlparse) {
		//var bases = [
		//	'http://www.renren.com',
		//	'www.renren.com',
		//	'http://www.renren.com/',
		//	'www.renren.com/',
		//	'http://www.renren.com/blog',
		//	'www.renren.com/blog',
		//	'http://www.renren.com/blog/blog2'
		//	'http://www.renren.com/blog/blog2/test.html'
		//];
		//var urls = [
		//	'http://www.renren.com/test.html',
		//	'www.renren.com/test.html',
		//	'test.html',
		//	'/test.html',
		//	'blog/test.html',
		//	'/blog/test.html',
		//	'blog/blog2/test.html',
		//	'/blog/blog2/test.html',
		//	'blog/blog2/blog3/test.html',
		//	'/blog/blog2/blog3/test.html',
		//];

		// code auto-generated by Python generate_javascript.py
		try { 
			equal(urlparse.urljoin('http://www.renren.com', 'http://www.renren.com/test.html'),'http://www.renren.com/test.html','urlparse.urljoin(http://www.renren.com, http://www.renren.com/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com, http://www.renren.com/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com', 'www.renren.com/test.html'),'http://www.renren.com/www.renren.com/test.html','urlparse.urljoin(http://www.renren.com, www.renren.com/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com, www.renren.com/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com', 'test.html'),'http://www.renren.com/test.html','urlparse.urljoin(http://www.renren.com, test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com, test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com', '/test.html'),'http://www.renren.com/test.html','urlparse.urljoin(http://www.renren.com, /test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com, /test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com', 'blog/test.html'),'http://www.renren.com/blog/test.html','urlparse.urljoin(http://www.renren.com, blog/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com, blog/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com', '/blog/test.html'),'http://www.renren.com/blog/test.html','urlparse.urljoin(http://www.renren.com, /blog/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com, /blog/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com', 'blog/blog2/test.html'),'http://www.renren.com/blog/blog2/test.html','urlparse.urljoin(http://www.renren.com, blog/blog2/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com, blog/blog2/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com', '/blog/blog2/test.html'),'http://www.renren.com/blog/blog2/test.html','urlparse.urljoin(http://www.renren.com, /blog/blog2/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com, /blog/blog2/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com', 'blog/blog2/blog3/test.html'),'http://www.renren.com/blog/blog2/blog3/test.html','urlparse.urljoin(http://www.renren.com, blog/blog2/blog3/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com, blog/blog2/blog3/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com', '/blog/blog2/blog3/test.html'),'http://www.renren.com/blog/blog2/blog3/test.html','urlparse.urljoin(http://www.renren.com, /blog/blog2/blog3/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com, /blog/blog2/blog3/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com', 'http://www.renren.com/test.html'),'http://www.renren.com/test.html','urlparse.urljoin(www.renren.com, http://www.renren.com/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com, http://www.renren.com/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com', 'www.renren.com/test.html'),'www.renren.com/test.html','urlparse.urljoin(www.renren.com, www.renren.com/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com, www.renren.com/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com', 'test.html'),'test.html','urlparse.urljoin(www.renren.com, test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com, test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com', '/test.html'),'/test.html','urlparse.urljoin(www.renren.com, /test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com, /test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com', 'blog/test.html'),'blog/test.html','urlparse.urljoin(www.renren.com, blog/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com, blog/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com', '/blog/test.html'),'/blog/test.html','urlparse.urljoin(www.renren.com, /blog/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com, /blog/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com', 'blog/blog2/test.html'),'blog/blog2/test.html','urlparse.urljoin(www.renren.com, blog/blog2/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com, blog/blog2/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com', '/blog/blog2/test.html'),'/blog/blog2/test.html','urlparse.urljoin(www.renren.com, /blog/blog2/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com, /blog/blog2/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com', 'blog/blog2/blog3/test.html'),'blog/blog2/blog3/test.html','urlparse.urljoin(www.renren.com, blog/blog2/blog3/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com, blog/blog2/blog3/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com', '/blog/blog2/blog3/test.html'),'/blog/blog2/blog3/test.html','urlparse.urljoin(www.renren.com, /blog/blog2/blog3/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com, /blog/blog2/blog3/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/', 'http://www.renren.com/test.html'),'http://www.renren.com/test.html','urlparse.urljoin(http://www.renren.com/, http://www.renren.com/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/, http://www.renren.com/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/', 'www.renren.com/test.html'),'http://www.renren.com/www.renren.com/test.html','urlparse.urljoin(http://www.renren.com/, www.renren.com/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/, www.renren.com/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/', 'test.html'),'http://www.renren.com/test.html','urlparse.urljoin(http://www.renren.com/, test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/, test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/', '/test.html'),'http://www.renren.com/test.html','urlparse.urljoin(http://www.renren.com/, /test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/, /test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/', 'blog/test.html'),'http://www.renren.com/blog/test.html','urlparse.urljoin(http://www.renren.com/, blog/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/, blog/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/', '/blog/test.html'),'http://www.renren.com/blog/test.html','urlparse.urljoin(http://www.renren.com/, /blog/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/, /blog/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/', 'blog/blog2/test.html'),'http://www.renren.com/blog/blog2/test.html','urlparse.urljoin(http://www.renren.com/, blog/blog2/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/, blog/blog2/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/', '/blog/blog2/test.html'),'http://www.renren.com/blog/blog2/test.html','urlparse.urljoin(http://www.renren.com/, /blog/blog2/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/, /blog/blog2/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/', 'blog/blog2/blog3/test.html'),'http://www.renren.com/blog/blog2/blog3/test.html','urlparse.urljoin(http://www.renren.com/, blog/blog2/blog3/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/, blog/blog2/blog3/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/', '/blog/blog2/blog3/test.html'),'http://www.renren.com/blog/blog2/blog3/test.html','urlparse.urljoin(http://www.renren.com/, /blog/blog2/blog3/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/, /blog/blog2/blog3/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com/', 'http://www.renren.com/test.html'),'http://www.renren.com/test.html','urlparse.urljoin(www.renren.com/, http://www.renren.com/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com/, http://www.renren.com/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com/', 'www.renren.com/test.html'),'www.renren.com/www.renren.com/test.html','urlparse.urljoin(www.renren.com/, www.renren.com/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com/, www.renren.com/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com/', 'test.html'),'www.renren.com/test.html','urlparse.urljoin(www.renren.com/, test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com/, test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com/', '/test.html'),'/test.html','urlparse.urljoin(www.renren.com/, /test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com/, /test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com/', 'blog/test.html'),'www.renren.com/blog/test.html','urlparse.urljoin(www.renren.com/, blog/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com/, blog/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com/', '/blog/test.html'),'/blog/test.html','urlparse.urljoin(www.renren.com/, /blog/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com/, /blog/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com/', 'blog/blog2/test.html'),'www.renren.com/blog/blog2/test.html','urlparse.urljoin(www.renren.com/, blog/blog2/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com/, blog/blog2/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com/', '/blog/blog2/test.html'),'/blog/blog2/test.html','urlparse.urljoin(www.renren.com/, /blog/blog2/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com/, /blog/blog2/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com/', 'blog/blog2/blog3/test.html'),'www.renren.com/blog/blog2/blog3/test.html','urlparse.urljoin(www.renren.com/, blog/blog2/blog3/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com/, blog/blog2/blog3/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com/', '/blog/blog2/blog3/test.html'),'/blog/blog2/blog3/test.html','urlparse.urljoin(www.renren.com/, /blog/blog2/blog3/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com/, /blog/blog2/blog3/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog', 'http://www.renren.com/test.html'),'http://www.renren.com/test.html','urlparse.urljoin(http://www.renren.com/blog, http://www.renren.com/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog, http://www.renren.com/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog', 'www.renren.com/test.html'),'http://www.renren.com/www.renren.com/test.html','urlparse.urljoin(http://www.renren.com/blog, www.renren.com/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog, www.renren.com/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog', 'test.html'),'http://www.renren.com/test.html','urlparse.urljoin(http://www.renren.com/blog, test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog, test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog', '/test.html'),'http://www.renren.com/test.html','urlparse.urljoin(http://www.renren.com/blog, /test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog, /test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog', 'blog/test.html'),'http://www.renren.com/blog/test.html','urlparse.urljoin(http://www.renren.com/blog, blog/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog, blog/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog', '/blog/test.html'),'http://www.renren.com/blog/test.html','urlparse.urljoin(http://www.renren.com/blog, /blog/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog, /blog/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog', 'blog/blog2/test.html'),'http://www.renren.com/blog/blog2/test.html','urlparse.urljoin(http://www.renren.com/blog, blog/blog2/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog, blog/blog2/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog', '/blog/blog2/test.html'),'http://www.renren.com/blog/blog2/test.html','urlparse.urljoin(http://www.renren.com/blog, /blog/blog2/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog, /blog/blog2/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog', 'blog/blog2/blog3/test.html'),'http://www.renren.com/blog/blog2/blog3/test.html','urlparse.urljoin(http://www.renren.com/blog, blog/blog2/blog3/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog, blog/blog2/blog3/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog', '/blog/blog2/blog3/test.html'),'http://www.renren.com/blog/blog2/blog3/test.html','urlparse.urljoin(http://www.renren.com/blog, /blog/blog2/blog3/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog, /blog/blog2/blog3/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com/blog', 'http://www.renren.com/test.html'),'http://www.renren.com/test.html','urlparse.urljoin(www.renren.com/blog, http://www.renren.com/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com/blog, http://www.renren.com/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com/blog', 'www.renren.com/test.html'),'www.renren.com/www.renren.com/test.html','urlparse.urljoin(www.renren.com/blog, www.renren.com/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com/blog, www.renren.com/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com/blog', 'test.html'),'www.renren.com/test.html','urlparse.urljoin(www.renren.com/blog, test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com/blog, test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com/blog', '/test.html'),'/test.html','urlparse.urljoin(www.renren.com/blog, /test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com/blog, /test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com/blog', 'blog/test.html'),'www.renren.com/blog/test.html','urlparse.urljoin(www.renren.com/blog, blog/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com/blog, blog/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com/blog', '/blog/test.html'),'/blog/test.html','urlparse.urljoin(www.renren.com/blog, /blog/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com/blog, /blog/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com/blog', 'blog/blog2/test.html'),'www.renren.com/blog/blog2/test.html','urlparse.urljoin(www.renren.com/blog, blog/blog2/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com/blog, blog/blog2/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com/blog', '/blog/blog2/test.html'),'/blog/blog2/test.html','urlparse.urljoin(www.renren.com/blog, /blog/blog2/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com/blog, /blog/blog2/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com/blog', 'blog/blog2/blog3/test.html'),'www.renren.com/blog/blog2/blog3/test.html','urlparse.urljoin(www.renren.com/blog, blog/blog2/blog3/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com/blog, blog/blog2/blog3/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('www.renren.com/blog', '/blog/blog2/blog3/test.html'),'/blog/blog2/blog3/test.html','urlparse.urljoin(www.renren.com/blog, /blog/blog2/blog3/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(www.renren.com/blog, /blog/blog2/blog3/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2', 'http://www.renren.com/test.html'),'http://www.renren.com/test.html','urlparse.urljoin(http://www.renren.com/blog/blog2, http://www.renren.com/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2, http://www.renren.com/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2', 'www.renren.com/test.html'),'http://www.renren.com/blog/www.renren.com/test.html','urlparse.urljoin(http://www.renren.com/blog/blog2, www.renren.com/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2, www.renren.com/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2', 'test.html'),'http://www.renren.com/blog/test.html','urlparse.urljoin(http://www.renren.com/blog/blog2, test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2, test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2', '/test.html'),'http://www.renren.com/test.html','urlparse.urljoin(http://www.renren.com/blog/blog2, /test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2, /test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2', 'blog/test.html'),'http://www.renren.com/blog/blog/test.html','urlparse.urljoin(http://www.renren.com/blog/blog2, blog/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2, blog/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2', '/blog/test.html'),'http://www.renren.com/blog/test.html','urlparse.urljoin(http://www.renren.com/blog/blog2, /blog/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2, /blog/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2', 'blog/blog2/test.html'),'http://www.renren.com/blog/blog/blog2/test.html','urlparse.urljoin(http://www.renren.com/blog/blog2, blog/blog2/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2, blog/blog2/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2', '/blog/blog2/test.html'),'http://www.renren.com/blog/blog2/test.html','urlparse.urljoin(http://www.renren.com/blog/blog2, /blog/blog2/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2, /blog/blog2/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2', 'blog/blog2/blog3/test.html'),'http://www.renren.com/blog/blog/blog2/blog3/test.html','urlparse.urljoin(http://www.renren.com/blog/blog2, blog/blog2/blog3/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2, blog/blog2/blog3/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2', '/blog/blog2/blog3/test.html'),'http://www.renren.com/blog/blog2/blog3/test.html','urlparse.urljoin(http://www.renren.com/blog/blog2, /blog/blog2/blog3/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2, /blog/blog2/blog3/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2/test.html', 'http://www.renren.com/test.html'),'http://www.renren.com/test.html','urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, http://www.renren.com/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, http://www.renren.com/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2/test.html', 'www.renren.com/test.html'),'http://www.renren.com/blog/blog2/www.renren.com/test.html','urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, www.renren.com/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, www.renren.com/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2/test.html', 'test.html'),'http://www.renren.com/blog/blog2/test.html','urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2/test.html', '/test.html'),'http://www.renren.com/test.html','urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, /test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, /test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2/test.html', 'blog/test.html'),'http://www.renren.com/blog/blog2/blog/test.html','urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, blog/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, blog/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2/test.html', '/blog/test.html'),'http://www.renren.com/blog/test.html','urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, /blog/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, /blog/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2/test.html', 'blog/blog2/test.html'),'http://www.renren.com/blog/blog2/blog/blog2/test.html','urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, blog/blog2/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, blog/blog2/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2/test.html', '/blog/blog2/test.html'),'http://www.renren.com/blog/blog2/test.html','urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, /blog/blog2/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, /blog/blog2/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2/test.html', 'blog/blog2/blog3/test.html'),'http://www.renren.com/blog/blog2/blog/blog2/blog3/test.html','urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, blog/blog2/blog3/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, blog/blog2/blog3/test.html), should not throw error : ' + e);
		}
		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2/test.html', '/blog/blog2/blog3/test.html'),'http://www.renren.com/blog/blog2/blog3/test.html','urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, /blog/blog2/blog3/test.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, /blog/blog2/blog3/test.html), should not throw error : ' + e);
		}

		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2/test.html', '.'),'http://www.renren.com/blog/blog2/','urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, .)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, .), should not throw error : ' + e);
		}

		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2/test.html', '..'),'http://www.renren.com/blog/','urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, ..)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, ..), should not throw error : ' + e);
		}

		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2/test.html', './test2.html'),'http://www.renren.com/blog/blog2/test2.html','urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, ./test2.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, ./test2.html), should not throw error : ' + e);
		}

		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2/test.html', '../test2.html'),'http://www.renren.com/blog/test2.html','urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, ../test2.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, ../test2.html), should not throw error : ' + e);
		}

		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2/test.html', '../blog2/test2.html'),'http://www.renren.com/blog/blog2/test2.html','urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, ../blog2/test2.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, ../blog2/test2.html), should not throw error : ' + e);
		}

		try { 
			equal(urlparse.urljoin('http://www.renren.com/blog/blog2/test.html', './blog3/test2.html'),'http://www.renren.com/blog/blog2/blog3/test2.html','urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, ./blog3/test2.html)'); 
		} catch (e) {
			ok(false, 'urlparse.urljoin(http://www.renren.com/blog/blog2/test.html, ./blog3/test2.html), should not throw error : ' + e);
		}
		
	});
});

