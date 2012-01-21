var console = console || { log: function() {} };

var ImageUploader = (function() {
	var publicApi = {};
	var config = {
		debug: true
	};
	
	publicApi.init = function(inputElement) {
		if ((!inputElement.getAttribute) || inputElement.getAttribute('type') !== 'file') {
			throw new Error('First argument to ImageUploader.init() must be an element of type="file"');
		}
		
		inputElement.addEventListener('change', function(event) {
			var cursor = 0;
			console.log('inputElement.change() called, do something with inputElement.files');
			for (; cursor < inputElement.files.length; ++cursor) {
				console.log(inputElement.files[cursor].name);
			}
		}, false);
		
		if (config.debug) {
			console.log('Initialised ImageUploader for '+inputElement);
		}
	};
		
	return publicApi;
}());