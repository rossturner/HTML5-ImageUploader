var console = console || { log: function() {} };

var ImageUploader = (function() {
	var publicApi = {}, config = {
		debug: true
	};
	
	publicApi.init = function(inputElement) {
		if ((!inputElement.getAttribute) || inputElement.getAttribute('type') !== 'file') {
			throw new Error('First argument to ImageUploader.init() must be an element of type="file"');
		}
		
		if (config.debug) {
			console.log('Initialised ImageUploader for '+inputElement);
		}
	};
		
	return publicApi;
}());