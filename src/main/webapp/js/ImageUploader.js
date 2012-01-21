var console = console || { log: function() {} };

var ImageUploader = (function() {
	var publicApi = {};
	var privateApi = {};
	var config = {
		debug: true
	};
	
	
	publicApi.init = function(inputElement, customConfig) {
		if ((!inputElement.getAttribute) || inputElement.getAttribute('type') !== 'file') {
			throw new Error('First argument to ImageUploader.init() must be an element of type="file"');
		}

		privateApi.setConfig(customConfig);
		
		inputElement.addEventListener('change', function(event) {
			var cursor = 0;
			for (; cursor < inputElement.files.length; ++cursor) {
				privateApi.handleFileSelection(inputElement.files[cursor]);
			}
		}, false);
		
		if (config.debug) {
			console.log('Initialised ImageUploader for '+inputElement);
		}
	};
	

	privateApi.handleFileSelection = function(file) {
		console.log(file.name);
	};
	
	privateApi.setConfig = function(customConfig) {
		if (customConfig) {
			// Read in custom config variables
			if (customConfig.container) {
				config.container = customConfig.container;
			}
		}
		
		// Create container if none set
		if (!config.container) {
			config.container = document.createElement('div');
			//config.container.setAttribute('style', 'display: none');
			document.body.appendChild(config.container);
		}
		
		config.workspace = document.createElement('div');
		document.body.appendChild(config.workspace);
	};
		
	return publicApi;
}());