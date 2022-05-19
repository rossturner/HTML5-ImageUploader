/**
 * ImageUploader.js - a client-side image resize and upload javascript module
 * 
 * @author Ross Turner (https://github.com/rossturner)
 */
var ImageUploader = function(config) {
    if (!config || (!config.inputElement) || (!config.inputElement.getAttribute) || config.inputElement.getAttribute('type') !== 'file') {
        throw new Error('Config object passed to ImageUploader constructor must include "inputElement" set to be an element of type="file"');
    }
    this.setConfig(config);

    var This = this;
    this.config.inputElement.addEventListener('change', function(event) {
        var fileArray = [];
        var cursor = 0;
        for (; cursor < This.config.inputElement.files.length; ++cursor) {
            fileArray.push(This.config.inputElement.files[cursor]);
        }
        This.progressObject = {
            total : parseInt(fileArray.length, 10),
            done : 0,
            currentItemTotal : 0,
            currentItemDone : 0
        };
        if (typeof This.config.onProgress === 'function') {
            This.config.onProgress(This.progressObject);
        }
        This.handleFileList(fileArray, This.progressObject);
    }, false);

    if (This.config.debug) {
        console.log('Initialised ImageUploader for ' + This.config.inputElement);
    }

};

ImageUploader.prototype.handleFileList = function(fileArray) {
    var This = this;
    if (fileArray.length > 1) {
        var file = fileArray.shift();
        this.handleFileSelection(file, function() {
            This.handleFileList(fileArray);
        });
    } else if (fileArray.length === 1) {
        this.handleFileSelection(fileArray[0], function() {
            if (typeof This.config.onComplete === 'function') {
                This.config.onComplete(This.progressObject);
            }
        });
    }
};

ImageUploader.prototype.handleFileSelection = function(file, completionCallback) {
    var img = document.createElement('img');
    this.currentFile = file;
    var reader = new FileReader();
    var This = this;
    reader.onload = function(e) {
        img.src = e.target.result;

        img.onload = function () {
            //Rotate image first if required
            if (This.config.autoRotate) {
                if (This.config.debug) {
                    console.log('ImageUploader: detecting image orientation...');
                }
                if ((typeof EXIF.getData === "function") && (typeof EXIF.getTag === "function")) {
                    EXIF.getData(img, function () {
                        var orientation = EXIF.getTag(this, "Orientation");
                        if (This.config.debug) {
                            console.log('ImageUploader: image orientation from EXIF tag = ' + orientation);
                        }
                        This.scaleImage(img, completionCallback, orientation);
                    });
                } else {
                    console.error("ImageUploader: can't read EXIF data, the Exif.js library not found");
                    This.scaleImage(img, completionCallback);
                }
            } else {
                //No rotation, just scale the image
                This.scaleImage(img, completionCallback);
            }
        };
    };
	reader.readAsDataURL(file);
};

ImageUploader.prototype.drawImage = function(context, img, x, y, width, height, deg, flip, flop, center) {
	context.save();

	if(typeof width === "undefined") { width = img.width; }
	if(typeof height === "undefined") { height = img.height; }
	if(typeof center === "undefined") { center = false; }

	// Set rotation point to center of image, instead of top/left
	if(center) {
		x -= width/2;
		y -= height/2;
	}

	// Set the origin to the center of the image
	context.translate(x + width/2, y + height/2);

	// Rotate the canvas around the origin
	var rad = 2 * Math.PI - deg * Math.PI / 180;    
	context.rotate(rad);

	// Flip/flop the canvas
	if(flip) { flipScale = -1; } else { flipScale = 1; }
	if(flop) { flopScale = -1; } else { flopScale = 1; }
	context.scale(flipScale, flopScale);

	// Draw the image    
	context.drawImage(img, -width/2, -height/2, width, height);

	context.restore();
};

//run ratio allows the code to keep shrinking an image until the POST data is under a target
ImageUploader.prototype.scaleImage = function(img, completionCallback, orientation, run_ratio =1) {
    var canvas = document.createElement('canvas');
	canvas.width = img.width;
	canvas.height = img.height;
	var ctx = canvas.getContext('2d');	
	ctx.save();
	
	//Good explanation of EXIF orientation is here http://www.daveperrett.com/articles/2012/07/28/exif-orientation-handling-is-a-ghetto/
	var width  = canvas.width;
	var styleWidth  = canvas.style.width;
    var height = canvas.height;
	var styleHeight = canvas.style.height;
	if (typeof orientation === 'undefined') {
        orientation = 1;
    }
    if (orientation) {
		if (orientation > 4) {
			canvas.width  = height;
			canvas.style.width  = styleHeight;
			canvas.height = width;
			canvas.style.height = styleWidth;
		}
		switch (orientation) {
			case 2: 
				ctx.translate(width, 0);
				ctx.scale(-1,1);
				break;
			case 3: 
				ctx.translate(width,height);
				ctx.rotate(Math.PI);
				break;
			case 4:
				ctx.translate(0,height);
				ctx.scale(1,-1);
				break;
			case 5:
				ctx.rotate(0.5 * Math.PI);
				ctx.scale(1,-1);
				break;
			case 6:
				ctx.rotate(0.5 * Math.PI);
				ctx.translate(0,-height);
				break;
			case 7: 
				ctx.rotate(0.5 * Math.PI);
				ctx.translate(width,-height);
				ctx.scale(-1,1);
				break;
			case 8:
				ctx.rotate(-0.5 * Math.PI);
				ctx.translate(-width,0);
				break;
		}
	}
	ctx.drawImage(img, 0, 0);
	ctx.restore();

	//Let's find the max available width for scaled image
	var ratio = canvas.width/canvas.height;
	var mWidth = Math.min(this.config.maxWidth, ratio*this.config.maxHeight, this.config.maxWidth * run_ratio);
	if ( (this.config.maxSize>0) && (this.config.maxSize<canvas.width*canvas.height/1000000) ) {
        mWidth = Math.min(mWidth, Math.floor(Math.sqrt(this.config.maxSize * ratio) * 1000));
    }
	if ( !!this.config.scaleRatio ) {
        mWidth = Math.min(mWidth, Math.floor(this.config.scaleRatio * canvas.width));
    }
	if (this.config.debug){
		console.log('ImageUploader: original image size = ' + canvas.width + ' px (width) X ' + canvas.height + ' px (height)');
		console.log('ImageUploader: scaled image size = ' + mWidth + ' px (width) X ' + Math.floor(mWidth/ratio) + ' px (height)');
	}
	if (mWidth<=0){
		mWidth = 1;
		console.warn('ImageUploader: image size is too small');
	}
	
    while (canvas.width >= (2 * mWidth)) {
        canvas = this.getHalfScaleCanvas(canvas);
    }

    if (canvas.width > mWidth) {
        canvas = this.scaleCanvasWithAlgorithm(canvas, mWidth);
    }

    var imageData = canvas.toDataURL('image/jpeg', this.config.quality);
	if (typeof this.config.onScale === 'function') {
        this.config.onScale(imageData);
    }
	if (this.config.debug) {
     		console.log('upload candidate size is ' + imageData.length);
	}
	if (imageData.length > this.config.maxUpload) {
        	if (this.config.debug) {  console.log("retrying resize at " + run_ratio); }
                this.scaleImage(img, filename, completionCallback, orientation,run_ratio - 0.1)
                return false;
        }	
    this.performUpload(imageData, completionCallback);
};

ImageUploader.prototype.performUpload = function(imageData, completionCallback) {
    var xhr = new XMLHttpRequest();
    var This = this;
    var uploadInProgress = true;
    var headers = this.config.requestHeaders;
    var headersArray;
    var i;

    xhr.onload = function(e) {
        uploadInProgress = false;
        This.uploadComplete(e, completionCallback);
    };
    xhr.upload.addEventListener("progress", function(e) {
        This.progressUpdate(e.loaded, e.total);
    }, false);
    xhr.open('POST', this.config.uploadUrl, true);
    
    if(typeof headers === 'object' && headers !== null) {
        Object.keys(headers).forEach(function(key,index) {
            if(typeof headers[key] !== 'string') {
                headersArray = headers[key];
                for(i = 0, j = headersArray.length; i < j; i++) {
                    xhr.setRequestHeader(key, headersArray[i]);
                }   
            } else {
                xhr.setRequestHeader(key, headers[key]);                
            }
        });
    }
    
    xhr.send(imageData.split(',')[1]);

    if (this.config.timeout) {
        setTimeout(function() {
            if (uploadInProgress) {
                xhr.abort();
                This.uploadComplete({
                    target: {
                        status: 'Timed out' 
                    }
                }, completionCallback);
            }
        }, this.config.timeout);
    }
    
    if (this.config.debug) {
        var resizedImage = document.createElement('img');
        this.config.workspace.appendChild(document.createElement('br'));
        this.config.workspace.appendChild(resizedImage);

        resizedImage.src = imageData;
    }
};

ImageUploader.prototype.uploadComplete = function(event, completionCallback) {
    this.progressObject.done++;
    this.progressUpdate(0, 0);
    completionCallback();
    if (typeof this.config.onFileComplete === 'function') {
        this.config.onFileComplete(event, this.currentFile);
    }
};

ImageUploader.prototype.progressUpdate = function(itemDone, itemTotal) {
    console.log('Uploaded '+itemDone+' of '+itemTotal);
    this.progressObject.currentItemDone = itemDone;
    this.progressObject.currentItemTotal = itemTotal;
    if (this.config.onProgress) {
        this.config.onProgress(this.progressObject);
    }
};

ImageUploader.prototype.scaleCanvasWithAlgorithm = function(canvas, maxWidth) {
    var scaledCanvas = document.createElement('canvas');

    var scale = maxWidth / canvas.width;

    scaledCanvas.width = canvas.width * scale;
    scaledCanvas.height = canvas.height * scale;

    var srcImgData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    var destImgData = scaledCanvas.getContext('2d').createImageData(scaledCanvas.width, scaledCanvas.height);

    this.applyBilinearInterpolation(srcImgData, destImgData, scale);

    scaledCanvas.getContext('2d').putImageData(destImgData, 0, 0);

    return scaledCanvas;
};

ImageUploader.prototype.getHalfScaleCanvas = function(canvas) {
    var halfCanvas = document.createElement('canvas');
    halfCanvas.width = canvas.width / 2;
    halfCanvas.height = canvas.height / 2;

    halfCanvas.getContext('2d').drawImage(canvas, 0, 0, halfCanvas.width, halfCanvas.height);

    return halfCanvas;
};

ImageUploader.prototype.applyBilinearInterpolation = function(srcCanvasData, destCanvasData, scale) {
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

ImageUploader.prototype.setConfig = function(customConfig) {
    this.config = customConfig;
    this.config.debug = this.config.debug || false;
    this.config.quality = 1.00;
    if (0.00 < customConfig.quality && customConfig.quality <= 1.00) {
        this.config.quality = customConfig.quality;
    }
    if ( (!this.config.maxWidth) || (this.config.maxWidth<0) ){
        this.config.maxWidth = 1024;
    }
	if ( (!this.config.maxHeight) || (this.config.maxHeight<0) ) {
        this.config.maxHeight = 1024;
    }
	if ( (!this.config.maxSize) || (this.config.maxSize<0) ) {
		this.config.maxSize = null;
	}
	if ( (!this.config.scaleRatio) || (this.config.scaleRatio <= 0) || (this.config.scaleRatio >= 1) ) {
		this.config.scaleRatio = null;
	}
	this.config.autoRotate = true;
	if (typeof customConfig.autoRotate === 'boolean') {
        this.config.autoRotate = customConfig.autoRotate;
    }

    // Create container if none set
    if (!this.config.workspace) {
        this.config.workspace = document.createElement('div');
        document.body.appendChild(this.config.workspace);
    }
};
