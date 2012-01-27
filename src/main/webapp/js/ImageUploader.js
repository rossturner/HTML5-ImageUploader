/**
 * ImageUploader.js - a client-side image resize and upload javascript module
 * @author Ross Turner (https://github.com/zsinj)
 */
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
            var fileArray = [];
            var cursor = 0;
            for (; cursor < config.inputElement.files.length; ++cursor) {
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

        };
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

    };

    privateApi.scaleCanvasWithAlgorithm = function(canvas) {
        var scaledCanvas = document.createElement('canvas');

        var scale = config.maxWidth / canvas.width;

        scaledCanvas.width = canvas.width * scale;
        scaledCanvas.height = canvas.height * scale;
        //config.workspace.appendChild(scaledCanvas);

        var srcImgData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
        var destImgData = scaledCanvas.getContext('2d').createImageData(scaledCanvas.width, scaledCanvas.height);

        privateApi.applyBilinearInterpolation(srcImgData, destImgData, scale);

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
    
    // Modified from http://www.philou.ch/js-bilinear-interpolation.html
    // Credit to Philippe Strauss
    privateApi.applyBilinearInterpolation = function(srcCanvasData, destCanvasData, scale) {
        // c.f.: wikipedia english article on bilinear interpolation
        // taking the unit square, the inner loop looks like this
        function inner(f00, f10, f01, f11, x, y) {
            var un_x = 1.0 - x;
            var un_y = 1.0 - y;
            return (f00 * un_x * un_y + f10 * x * un_y + f01 * un_x * y + f11 * x * y);
        }
        var i, j;
        var iyv, iy0, iy1, ixv, ix0, ix1;
        var idxD, idxS00, idxS10, idxS01, idxS11;
        var dx, dy;
        var r, g, b, a;
        for (i = 0; i < destCanvasData.height; ++i) {
            iyv = i / scale;
            iy0 = Math.floor(iyv);
            // Math.ceil can go over bounds
            iy1 = (Math.ceil(iyv) > (srcCanvasData.height - 1) ? (srcCanvasData.height - 1) : Math.ceil(iyv));
            for (j = 0; j < destCanvasData.width; ++j) {
                ixv = j / scale;
                ix0 = Math.floor(ixv);
                // Math.ceil can go over bounds
                ix1 = (Math.ceil(ixv) > (srcCanvasData.width - 1) ? (srcCanvasData.width - 1) : Math.ceil(ixv));
                idxD = (j + destCanvasData.width * i) * 4;
                // matrix to vector indices
                idxS00 = (ix0 + srcCanvasData.width * iy0) * 4;
                idxS10 = (ix1 + srcCanvasData.width * iy0) * 4;
                idxS01 = (ix0 + srcCanvasData.width * iy1) * 4;
                idxS11 = (ix1 + srcCanvasData.width * iy1) * 4;
                // overall coordinates to unit square
                dx = ixv - ix0;
                dy = iyv - iy0;
                // I let the r, g, b, a on purpose for debugging
                r = inner(srcCanvasData.data[idxS00], srcCanvasData.data[idxS10], srcCanvasData.data[idxS01], srcCanvasData.data[idxS11], dx, dy);
                destCanvasData.data[idxD] = r;

                g = inner(srcCanvasData.data[idxS00 + 1], srcCanvasData.data[idxS10 + 1], srcCanvasData.data[idxS01 + 1], srcCanvasData.data[idxS11 + 1], dx, dy);
                destCanvasData.data[idxD + 1] = g;

                b = inner(srcCanvasData.data[idxS00 + 2], srcCanvasData.data[idxS10 + 2], srcCanvasData.data[idxS01 + 2], srcCanvasData.data[idxS11 + 2], dx, dy);
                destCanvasData.data[idxD + 2] = b;

                a = inner(srcCanvasData.data[idxS00 + 3], srcCanvasData.data[idxS10 + 3], srcCanvasData.data[idxS01 + 3], srcCanvasData.data[idxS11 + 3], dx, dy);
                destCanvasData.data[idxD + 3] = a;
            }
        }
    };

    return publicApi;
}());