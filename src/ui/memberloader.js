object.define('ui/memberloader.js', function(require, exports) {

function load(items, callback) {
	if (!items) {
		callback();
		return;
	}
	items = items.trim();
	var dependencies = [];
	var memberNames = [];
	if (!Array.isArray(items)) {
		items = items.split(/\s*,\s*/g);
	}
	items.forEach(function(item) {
		dependencies.push(item.slice(0, item.lastIndexOf('.')).replace(/\./g, '/'));
		memberNames.push(item.slice(item.lastIndexOf('.') + 1));
	});
	require.async(dependencies, function() {
		var members = [];
		var member;
		for (var i = 0; i < arguments.length; i++) {
			member = arguments[i][memberNames[i]];
			if (member === undefined) {
				console.warn('can\'t find ' + memberNames[i] + ' in ' + dependencies[i]);
			}
			members.push(member);
		}
		callback.apply(null, members);
	});
}

exports.load = load;

});
