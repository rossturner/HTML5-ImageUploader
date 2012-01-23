var console = console || {
    log : function() {
    }
};

var ImageUploader = (function() {
    var publicApi = {};
    var privateApi = {};
    var config = {
        debug : true
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
            console.log('Initialised ImageUploader for ' + inputElement);
        }
    };

    privateApi.handleFileSelection = function(file) {
        console.log(file.name);

        var img = document.createElement('img');
        config.workspace.appendChild(img);
        config.workspace.appendChild(document.createElement('br'));
        var reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;

            setTimeout(function() {
                var canvas = document.createElement('canvas');

                canvas.width = img.width / 2;
                canvas.height = img.height / 2;

                config.workspace.appendChild(canvas);
                
                //thumbnailer(canvas, img, 1024, 1);
                
                var context = canvas.getContext('2d');
                context.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                var resizedImage = document.createElement('img');
                config.workspace.appendChild(resizedImage);
                
                resizedImage.src = canvas.toDataURL('image/jpeg');
                
                // ugh
                setTimeout(function() {
                    var canvas2 = document.createElement('canvas');

                    canvas2.width = resizedImage.width / 2;
                    canvas2.height = resizedImage.height / 2;

                    config.workspace.appendChild(canvas2);
                    canvas2.getContext('2d').drawImage(resizedImage, 0, 0, canvas2.width, canvas2.height);
                    
                    var quarterImage = document.createElement('img');
                    config.workspace.appendChild(quarterImage);
                    
                    quarterImage.src = canvas2.toDataURL('image/jpeg');
                    
                }, 300);
                
                
            }, 400);
        }
        reader.readAsDataURL(file);

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