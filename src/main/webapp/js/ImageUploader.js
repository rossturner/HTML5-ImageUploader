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

    publicApi.init = function(customConfig) {
        if ((!customConfig.inputElement) || (!customConfig.inputElement.getAttribute) || customConfig.inputElement.getAttribute('type') !== 'file') {
            throw new Error('Config object passed to ImageUploader.init() must include "inputElement" set to be an element of type="file"');
        }

        privateApi.setConfig(customConfig);

        config.inputElement.addEventListener('change', function(event) {
            var fileArray = new Array();
            for ( var cursor = 0; cursor < config.inputElement.files.length; ++cursor) {
                fileArray.push(config.inputElement.files[cursor]);
            }
            privateApi.handleFileList(fileArray);
        }, false);

        if (config.debug) {
            console.log('Initialised ImageUploader for ' + config.inputElement);
        }
    };

    privateApi.handleFileList = function(fileArray) {
        if (fileArray.length > 1) {
            var file = fileArray.shift();
            privateApi.handleFileSelection(file, function() {
                privateApi.handleFileList(fileArray);
            });
        } else if (fileArray.length === 1) {
            privateApi.handleFileSelection(fileArray[0], function() {
                console.log('completed!');
            });
        }
    };

    privateApi.handleFileSelection = function(file, completionCallback) {
        if (config.debug) {
            console.log(file.name + ' started at ' + new Date().getTime());
        }

        var img = document.createElement('img');
        //config.workspace.appendChild(img);
        config.workspace.appendChild(document.createElement('br'));
        var reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;

            setTimeout(function() {
                privateApi.scaleImage(img, completionCallback);
            }, 1);

        }
        reader.readAsDataURL(file);

    };

    privateApi.scaleImage = function(img, completionCallback) {

        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        //config.workspace.appendChild(canvas);

        while (canvas.width >= (2 * config.maxWidth)) {
            canvas = privateApi.getHalfScaleCanvas(canvas);
        }

        if (canvas.width > config.maxWidth) {
            canvas = privateApi.scaleCanvasWithAlgorithm(canvas);
        }

        //config.workspace.appendChild(canvas);

        var resizedImage = document.createElement('img');
        config.workspace.appendChild(resizedImage);

        resizedImage.src = canvas.toDataURL('image/jpeg');
        //config.workspace.removeChild(canvas);

        if (config.debug) {
            console.log('Finished at ' + new Date().getTime());
            completionCallback();
        }
        // ugh
        //        setTimeout(function() {
        //            var canvas2 = document.createElement('canvas');
        //
        //            canvas2.width = resizedImage.width / 2;
        //            canvas2.height = resizedImage.height / 2;
        //
        //            config.workspace.appendChild(canvas2);
        //            canvas2.getContext('2d').drawImage(resizedImage, 0, 0, canvas2.width, canvas2.height);
        //
        //            var quarterImage = document.createElement('img');
        //            config.workspace.appendChild(quarterImage);
        //
        //            quarterImage.src = canvas2.toDataURL('image/jpeg');
        //
        //            setTimeout(function() {
        //                var canvas3 = document.createElement('canvas');
        //
        //                var scale = 1024 / canvas2.width;
        //
        //                canvas3.width = canvas2.width * scale;
        //                canvas3.height = canvas2.height * scale;
        //                config.workspace.appendChild(canvas3);
        //
        //                var srcImgData = canvas2.getContext('2d').getImageData(0, 0, canvas2.width, canvas2.height);
        //                var destImgData = canvas3.getContext('2d').createImageData(canvas3.width, canvas3.height);
        //
        //                BilinearInterpolation(srcImgData, destImgData, scale);
        //
        //                canvas3.getContext('2d').putImageData(destImgData, 0, 0);
        //
        //                //canvas3.getContext('2d').drawImage(quarterImage, 0, 0, canvas3.width, canvas3.height);
        //
        //                var sizedImage = document.createElement('img');
        //                config.workspace.appendChild(sizedImage);
        //
        //                sizedImage.src = canvas3.toDataURL('image/jpeg');
        //
        //            }, 300);
        //
        //        }, 300);

    };

    privateApi.scaleCanvasWithAlgorithm = function(canvas) {
        var scaledCanvas = document.createElement('canvas');

        var scale = config.maxWidth / canvas.width;

        scaledCanvas.width = canvas.width * scale;
        scaledCanvas.height = canvas.height * scale;
        //config.workspace.appendChild(scaledCanvas);

        var srcImgData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
        var destImgData = scaledCanvas.getContext('2d').createImageData(scaledCanvas.width, scaledCanvas.height);

        BilinearInterpolation(srcImgData, destImgData, scale);

        scaledCanvas.getContext('2d').putImageData(destImgData, 0, 0);

        return scaledCanvas;
    };

    privateApi.getHalfScaleCanvas = function(canvas) {
        var halfCanvas = document.createElement('canvas');
        halfCanvas.width = canvas.width / 2;
        halfCanvas.height = canvas.height / 2;

        halfCanvas.getContext('2d').drawImage(canvas, 0, 0, halfCanvas.width, halfCanvas.height);

        return halfCanvas;
    };

    privateApi.setConfig = function(customConfig) {
        if (customConfig) {
            // Read in custom config variables
            // TODO extract setter function
            if (customConfig.inputElement) {
                config.inputElement = customConfig.inputElement;
            }
            if (customConfig.container) {
                config.container = customConfig.container;
            }
            if (customConfig.maxWidth) {
                config.maxWidth = customConfig.maxWidth;
            }
        }

        if (!config.maxWidth) {
            config.maxWidth = 1024;
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