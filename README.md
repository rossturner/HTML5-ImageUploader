# HTML5 Image Uploader Readme #

The primary goal of this project is ImageUploader.js, a javascript module which can perform client-side resizing of images and uploads to a remote server using only HTML5 features (e.g. the Canvas and FileReader APIs).

For demonstration purposes this is packaged with a Java web application with a RESTful service to handle the uploaded images. This is an Apache Maven project, use "mvn clean install" to build the webapp and "mvn jetty:run" to run the app on localhost:8080

## Installation and Requirements ##
Include the ImageUploader.js file into your HTML page. Dependencies (include them first):

- **[Exif.js](https://github.com/exif-js/exif-js)**, a JavaScript library for reading EXIF image metadata 

## Usage ##

Create a new ImageUploader, passing in a javascript object hash of config, e.g.

```javascript
var uploader = new ImageUploader(config);
```

Where **config** contains the following properties:

### Obligatory properties ###

- **inputElement** - A file-type input element
- **uploadUrl** - The URL to POST uploaded images to

### Optional properties ###
#### Size restriction properties ####
These properties are used as conditions when the image should be scaled down proportionally before upload. If several properties are applied, then the image will be scaled down to the maximum available size that will fit all the conditions.

- **maxWidth** - An integer in pixels for the maximum width allowed for uploaded images, selected images with a greater width than this value will be scaled down before upload. Default value: 1024.
- **maxHeight** - An integer in pixels for the maximum height allowed for uploaded images, selected images with a greater height than this value will be scaled down before upload. Default value: 1024.
- **maxSize** - A float value in megapixels (MP) for the maximum overall size of the image allowed for uploaded images, selected images with a greater size than this value will be scaled down before upload. The size of the image is calculated by the formula `size = width * height / 1000`, where `width` and `height` are the dimensions of the image in pixels. If the value is null or is not specified, then maximum size restriction is not applied. Default value: null. For websites it's good to set this value around 1.7: for landscape images taken by standard photo cameras (Canon, Nikon, etc.), this value will lead to scaling down the original photo to size about 1600 x 1000 px, which is sufficient for displaying the scaled image on large screen monitors.  
- **scaleRatio** - Allows scaling down to a specified fraction of the original size. (Example: a value of 0.5 will reduce the size by half.) Accepts a decimal value between 0 and 1.

#### Other properties ####
- **quality** - A float between 0 and 1.00 for the image quality to use in the resulting image data, around 0.9 is recommended. Default value: 1.0.
- **autoRotate** - A boolean flag, if true then EXIF information from the image is parsed and the image is rotated correctly before upload. If false, then no processing is performed, and unwanted image flipping can happen. This flag is useful for JPEG images that were taken on a camera or mobile phone (like iPhone) that can save the image with arbitrary orientation and specifies the correct orientation in the EXIF tag. This tag should be parsed and related rotation should be applied for correct visualization of the image. Examples of such images you can find in the `images/exif` folder. Recommended and default value: true.
- **timeout** - A number in milliseconds specifying the maximum time to wait for file uploads to finish, after which they will be aborted.

#### Debug properties ####
- **debug** - A boolean flag to show the images in a `<div>` on the containing page before upload. Default value: false.
- **workspace** - An element within which images are appended before upload (when **debug** is set to true). If not specified, then a new `<div>` tag will be appended to the end of HTML body where the images will be rendered.

#### Callback properties ####
- **onScale** - A function which is invoked when final image is generated right before the upload starts. 1 argument passed: image data in data URL format. This callback function is useful for displaying a thumbnail (preview) of the selected image with correct orientation (the autoRotate option should be set to true).
- **onProgress** - A function which is invoked on upload progress, with a single argument of an object containing the following:

 - **total** - The total number of images selected for upload
 - **done** - The number of images uploaded so far
 - **currentItemTotal** - The number of bytes to be uploaded for the currently uploading image
 - **currentItemDone** - The total number of bytes to upload for the current image

- **onFileComplete** - A function invoked on completion of uploading each selected image which is passed two arguments, the first is the event object from the XmlHttpRequest, and the second if the corresponding File object from the input element
- **onComplete** - A function invoked on completion of all images being uploaded (passed no arguments)

## Example ##
Below is an example of using the ImageUploader.js for uploading images on HTML page and further processing of the images at the server.
  
### HTML ###
In our example we have a page with 3 input elements for selecting files that will be uploaded. When user selects a file, it will start to upload automatically. The user can select 1 file per input element.
 
We will use the following additional libraries (they are not required by the ImageUploader.js, but we will use them to make our example look pretty):

- [UIKit](https://getuikit.com/), it allows to apply some nice CSS styles (the name of the classes begin with `uk-` prefix). In our case we will use it to show:
	- button for selecting a file instead of standard rectangular input box.
	- show progress bar as indicator of uploading progress.
- [jQuery](https://jquery.com/), to write less JavaScript code. If you don't like jQuery, you can still use ImageUploader.js with pure "vanilla" JavaScript.

Screenshot of the resulting HTML page:

![Screenshot](https://github.com/rvalitov/HTML5-ImageUploader/raw/master/images/wiki/html-page.jpg)

The progress bar becomes visible when the user selects the image. It becomes hidden after the image upload completes.

The code of HTML page:

```HTML
<html>
<head>
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.2/css/uikit.gradient.min.css" integrity="sha256-TLgWPS4CoQk94wbnfeHKRaBpM3IQS42Y3pqb3CTDFJI=" crossorigin="anonymous" />
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.2/css/components/progress.gradient.min.css" integrity="sha256-z+JFPUwyB++qqAA/9qdfL/hpFnwdDWTAq5gYt0+OkZE=" crossorigin="anonymous" />
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/uikit/2.27.2/css/components/form-file.gradient.min.css" integrity="sha256-E4mr2pSGSE3pbt5V6fEn+e2mA2xqfagllq4tRqJUsOk=" crossorigin="anonymous" />

	<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.12.4/jquery.min.js" integrity="sha256-ZosEbRLbNQzLpnKIkEdrPv7lOy9C27hHQ+Xp8a4MxAQ=" crossorigin="anonymous"></script>
	<script type="text/javascript" src="/js/exif.js"></script>
	<script type="text/javascript" src="/js/ImageUploader.js"></script>
	<script type="text/javascript" src="/js/custom.js"></script>
</head>
<body>
	<div class="uk-text-center uk-margin-top">
		<div class="uk-form-file">
			<button class="uk-button uk-button-success image-upload" id="upload-button-1"><i class="uk-icon-upload uk-margin-small-right"></i>Select and upload image</button>
			<input class="image-upload" data-id="1" id="uploadImage3" type="file" name="images[1]" accept="image/jpeg,image/jpg" data-product="1034">
			
			<div class="uk-alert uk-alert-success uk-hidden" id="upload-container-1">
				<p class="uk-text-center">Uploading, please wait...</p>
				<div id="upload-progress-1" class="uk-progress uk-progress-small uk-progress-success uk-progress-striped uk-active">
					<div class="uk-progress-bar"></div>
				</div>
			</div>
		</div>
	</div>
	<div class="uk-text-center uk-margin-top">
		<div class="uk-form-file">
			<button class="uk-button uk-button-success image-upload" id="upload-button-2"><i class="uk-icon-upload uk-margin-small-right"></i>Select and upload image</button>
			<input class="image-upload" data-id="2" id="uploadImage2" type="file" name="images[2]" accept="image/jpeg,image/jpg" data-product="1034">
			
			<div class="uk-alert uk-alert-success uk-hidden" id="upload-container-2">
				<p class="uk-text-center">Uploading, please wait...</p>
				<div id="upload-progress-2" class="uk-progress uk-progress-small uk-progress-success uk-progress-striped uk-active">
					<div class="uk-progress-bar"></div>
				</div>
			</div>
		</div>
	</div>
	<div class="uk-text-center uk-margin-top">
		<div class="uk-form-file">
			<button class="uk-button uk-button-success image-upload" id="upload-button-3"><i class="uk-icon-upload uk-margin-small-right"></i>Select and upload image</button>
			<input class="image-upload" data-id="3" id="uploadImage3" type="file" name="images[3]" accept="image/jpeg,image/jpg" data-product="1034">
			
			<div class="uk-alert uk-alert-success uk-hidden" id="upload-container-3">
				<p class="uk-text-center">Uploading, please wait...</p>
				<div id="upload-progress-3" class="uk-progress uk-progress-small uk-progress-success uk-progress-striped uk-active">
					<div class="uk-progress-bar"></div>
				</div>
			</div>
		</div>
	</div>
</body>
</html>
```

Notes:

- In the code above we use `accept="image/jpeg,image/jpg"` to limit the file types that user can select. This approach works with all modern HTML5 browsers (desktop and mobile). But keep in mind, that the user can bypass this limitation and select arbitrary file. We will do some additional validation of file extension in the JavaScript code below.
- The input tag contains additional attributes such as `data-id` and `data-product`. We use them to show how you can add extra information to your input data and then pass it to the server. It can be useful when the HTML page is generated dynamically by the server (for example, using PHP, Perl or some other script).
- We add class `image-upload` to the input elements in order to mark out those, that should be processed with ImageUploader.js. Such approach allows to have different input elements in HTML page without conflicts.

### JavaScript ###
Below is the code of custom.js, which contains code for managing the HTML page (comments are in the code):

```javascript
jQuery(document).ready(function($){
	/* Initialization of input elements and ImageUploader.js */
	$("input.image-upload").each(function(index){
		var id=$(this).attr('data-id');
		var id_product = $(this).attr('data-product');
		var uploader = new ImageUploader({'inputElement': $(this).get(0), 
			'onProgress': function(info)
			{
				/* Updating the progress bar */
				if (info['currentItemTotal']<=0)
					return; 
				var progress=info['currentItemDone']*100.0/info['currentItemTotal'];
				$('#upload-progress-'+id+' div').css('width',progress+'%');
			}, 
			'onComplete': function()
			{
				/* Enable upload button */
				$('#upload-button-'+id).removeProp('disabled');
				/* Hide progress bar */
				$("#upload-container-"+id).addClass("uk-hidden");
			},
			/* Add rand parameter to prevent accidental caching of the image by the server */
			'uploadUrl': 'index.php?action=upload_image&id_image=' + id + '&id_product=' + id_product + '&rand=' + new Date().getTime(),
			'debug': true
			});
	});
	
	/* The function below is triggered every time the user selects a file */
	$("input.image-upload").change(function(index){
		/* We will check additionally the extension of the image if it's correct and we support it */
		var extension = $(this).val();
		if (extension.length>0){
			extension = extension.match(/[^.]+$/).pop().toLowerCase();
			extension = ~$.inArray(extension, ['jpg', 'jpeg']);
		}
		else{
			event.preventDefault();
			return;
		}
		
		if (!extension)
		{
			event.preventDefault();
			console.error('Unsupported image format');
			return;
		}
		var id=$(this).attr('data-id');
		/* Disable upload button until current upload completes */
		$('#upload-button-'+id).prop('disabled',true);
		/* Show progress bar */
		$("#upload-container-"+id).removeClass("uk-hidden");
		/* If you want, you can show a preview of the selected image to the user, but to keep the code simple, we will skip this step */
	});
});
```

### PHP ###
This part of the example covers the issue of processing the files on the server. In our example we use `index.php` as a file that is used to recieve and save the images from ImageUploader.js. The code below is written in PHP, but you can use it with any other language that you are familiar with.

```php
<?php
//Helper function returns value from GET or POST request
function getValue($key, $defaultValue = false)
{
 	if (!is_string($key))
		return false;
	$ret = (isset($_POST[$key]) ? $_POST[$key] : (isset($_GET[$key]) ? $_GET[$key] : $defaultValue));

	if (is_string($ret))
		$ret = stripslashes(urldecode(preg_replace('/((\%5C0+)|(\%00+))/i', '', urlencode($ret))));
	else
		return false;
	return $ret;
}

//Helper function to save image
function saveTempImage($id_product, $id_image, $contents){
	//You can use your imagination and store the images on the server using your own naming logic, we use the following:
	$filename = __DIR__.'product-'-'.$id_product.'-'.$id_image.'.jpg';
	$res = file_put_contents($filename, $contents);
	if ($res===false)
		return false;

	//Validate that it's a JPEG image
	$im = @imagecreatefromjpeg($filename);
	if ($im)
		return true;
	//Delete the image if it's not JPEG
	@unlink($filename);
	return false;
}

//Main code, used for processing uploaded image
$id_product = (int)getValue('id_product');
$id_image = (int)getValue('id_image');
$raw_64 = file_get_contents('php://input');
// Base64 decode the input stream
$img = base64_decode($raw_64);
if (saveTempImage($id_product, $id_image, $img))
	die('ok');
else
	die('error');
?>
```