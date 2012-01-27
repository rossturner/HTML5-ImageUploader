// Taken from http://www.philou.ch/js-bilinear-interpolation.html
// Credit to Philippe Strauss

var BilinearInterpolation = (function() {

    function ivect(ix, iy, w) {
        // byte array, r,g,b,a
        return ((ix + w * iy) * 4);
    }

    function bilinear(srcImg, destImg, scale) {
        // c.f.: wikipedia english article on bilinear interpolation
        // taking the unit square, the inner loop looks like this
        // note: there's a function call inside the double loop to this one
        // maybe a performance killer, optimize this whole code as you need
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
        for (i = 0; i < destImg.height; ++i) {
            iyv = i / scale;
            iy0 = Math.floor(iyv);
            // Math.ceil can go over bounds
            iy1 = (Math.ceil(iyv) > (srcImg.height - 1) ? (srcImg.height - 1) : Math.ceil(iyv));
            for (j = 0; j < destImg.width; ++j) {
                ixv = j / scale;
                ix0 = Math.floor(ixv);
                // Math.ceil can go over bounds
                ix1 = (Math.ceil(ixv) > (srcImg.width - 1) ? (srcImg.width - 1) : Math.ceil(ixv));
                idxD = ivect(j, i, destImg.width);
                // matrix to vector indices
                idxS00 = ivect(ix0, iy0, srcImg.width);
                idxS10 = ivect(ix1, iy0, srcImg.width);
                idxS01 = ivect(ix0, iy1, srcImg.width);
                idxS11 = ivect(ix1, iy1, srcImg.width);
                // overall coordinates to unit square
                dx = ixv - ix0;
                dy = iyv - iy0;
                // I let the r, g, b, a on purpose for debugging
                r = inner(srcImg.data[idxS00], srcImg.data[idxS10], srcImg.data[idxS01], srcImg.data[idxS11], dx, dy);
                destImg.data[idxD] = r;

                g = inner(srcImg.data[idxS00 + 1], srcImg.data[idxS10 + 1], srcImg.data[idxS01 + 1], srcImg.data[idxS11 + 1], dx, dy);
                destImg.data[idxD + 1] = g;

                b = inner(srcImg.data[idxS00 + 2], srcImg.data[idxS10 + 2], srcImg.data[idxS01 + 2], srcImg.data[idxS11 + 2], dx, dy);
                destImg.data[idxD + 2] = b;

                a = inner(srcImg.data[idxS00 + 3], srcImg.data[idxS10 + 3], srcImg.data[idxS01 + 3], srcImg.data[idxS11 + 3], dx, dy);
                destImg.data[idxD + 3] = a;
            }
        }
    }

    return bilinear;
}());
//
//var loadCan = document.getElementById("load-canvas");
//var dispCan = document.getElementById("disp-canvas");
//
//var loadCtx = loadCan.getContext("2d");
//var dispCtx = dispCan.getContext("2d");
//
//var scale = 1.414;
//
//var image_var = new Image();
//image_var.onload = function() {
//    loadCan.setAttribute("width", image_var.width);
//    loadCan.setAttribute("height", image_var.height);
//    loadCan.style.position = "fixed";
//    loadCan.width = image_var.width;
//    loadCan.height = image_var.height;
//    loadCtx.drawImage(image_var, 0, 0, image_var.width, image_var.height);
//
//    // getImageData : Chrome & FF: Unable to get image data from canvas because the canvas
//    // has been tainted by cross-origin data.
//    // when served from localhost, dev laptop
//    var srcImg = loadCtx.getImageData(0, 0, image_var.width, image_var.height);
//
//    var newWidth = Math.ceil(image_var.width * scale);
//    var newHeight = Math.ceil(image_var.height * scale);
//    dispCan.width = newWidth;
//    dispCan.height = newHeight;
//    dispCan.setAttribute("width", newWidth);
//    dispCan.setAttribute("height", newHeight);
//    var destImg = dispCtx.createImageData(newWidth, newHeight);
//    bilinear(srcImg, destImg, scale);
//
//    dispCtx.putImageData(destImg, 0, 0);
//}
//image_var.src = "http://www.philou.ch/pic/fear_makes_the_wolf_look_bigger.jpg";