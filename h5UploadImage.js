var curIndex = 0,     /* 当前上传的是第几张 */
    lastImgNum = 0;   /* 上次上传图片的数量 */
/* 上传图片 */
var UploadCarImage = function () {
    var ithis = this,
    curImgCount = 0, /* 当前上传图片数量 */
    addImgBtn = $('#addImgBtn'),  /* 上传按钮 */
    addUploadLi = $('.upload-album'),
    AlbumList = $('#AlbumList'),
    specialVersion = false; /* 如果是特殊版本设置[主要是安卓4.2操作系统]specialVersion=true */
    opts = { width: 800, height: 600, quality: 0.7, type: 'image/jpeg', imageMaxSize: 5, maxPicCount: 6, sendurl: "http://api.ische.cn/wapi.ashx?no=10094", remote: 'http://api.ische.cn' };

    this.loadModify = function () {
        var imgs = getCookie('imgscookie');
        if (imgs.length > 0) {
            var imgarr = imgs.split(',');
            for (var m = 0, j = imgarr.length; m < j; m++) {
                var newLi = $('<div class="Album-item col-1-3" id="Album-item-' + curIndex + '">'
                        + '<input type="hidden" name="hid_photo_info" value="' + imgarr[m] + '" />'
                        + '<div class="img-box">'
                        + '<img src="' + opts.remote + imgarr[m] + '" />'
                        + '</div>'
                        + '<a class="delete iconfont" onclick="uploadCarPic.clearImg(' + curIndex + ')">&#xe70f;</a>'
                        + '</div>');
                addUploadLi.before(newLi)
                curIndex++;
                lastImgNum++;
                ithis.lastImgCount();
            }
        }
    }

    /*初始化*/
    this.init = function () {
        if (specialVersion) {
            addImgBtn.on('click', ithis.appOpenImgDialogue);
        } else {
            addImgBtn.on('change', ithis.uploadCarImage);
        }
    };

    var isUploading = false,  /* 是否正在上传 */
        i = 0,  /* 循环上传图片时当前上传到第几张 */
        fileCount = 0,  /* 当前选择图片的张数 */
        files = null,
        fileinfo = new Object();  /* 当前选择图片的对象 */

    /* 选择图片事件 */
    this.uploadCarImage = function (e) {
        if (isUploading) {
            alert('图片正在上传中请稍等');
            addImgBtn.val('');
        } else {
            i = 0,
            fileCount = 0,
            files = e.target.files,
            fileCount = files.length;

            if (curImgCount === 0 && files.length > opts.maxPicCount) {
                alert('最多上传' + opts.maxPicCount + '张图片');
                return;
            } else if (files.length > (opts.maxPicCount - curImgCount)) {
                alert('还可以上传' + (opts.maxPicCount - curImgCount) + '张图片');
                return;
            }
            ithis.compressUploadImg();
        }
    };

    /* 图片压缩并上传 */
    this.compressUploadImg = function () {
        if (i == fileCount) {
            ithis.reCount();
            addImgBtn.val('');
            return;
        } else {
            var newLi = $('<div class="Album-item col-1-3" id="Album-item-' + curIndex + '">'
                        + '<input type="hidden" name="hid_photo_info" value="" />'
                        + '<div class="img-box">'
                        + '上传中'
                        + '</div>'
                        + '<a class="delete iconfont" onclick="uploadCarPic.clearImg(' + curIndex + ')">&#xe70f;</a>'
                        + '</div>');
            addUploadLi.before(newLi)
            fileinfo = {
                // properties of standard File object || Gecko 1.9 properties
                type: files[i].type || '', // MIME type
                size: files[i].size || files[i].fileSize,
                name: files[i].name || files[i].fileName
            };
            if ((files[i].size / (1024 * 1024)) > opts.imageMaxSize) {
                $('#Album-item-' + curIndex).find(".img-box").html('<div class="img-fail">超过5M</div>');
                i++;
                curIndex++;
                isUploading = false;
                ithis.compressUploadImg();
            } else {
                compressImg();
            }
        }

        /* 压缩图片 */
        function compressImg() {
            var canvas = document.createElement('canvas'),
                context = canvas.getContext('2d'),
                mpImg = new MegaPixImage(files[i]),
                reader = new FileReader(),
                w = 0, h = 0; /* 图片的原始宽高 */
            image = new Image(); /* 承载图片对象 */
            reader.readAsDataURL(files[i]);
            reader.onload = function (e) {
                var result = e.target.result;
                image.onload = function () {
                    w = image.width;
                    h = image.height;
                    drawImage();
                }
                image.src = result;
            };
            reader.onerror = function () {
                curIndex++;
                i++;
                isUploading = false;
                ithis.compressUploadImg();
            };
            /* 真正的压缩 */
            function drawImage() {
                var dataURL = '', scale = 1;
                //if (w > h) {
                if (w > opts.width) {
                    scale = opts.width / w; opts.height = h * scale;
                }
                else {
                    opts.width = w; opts.height = h;
                }
                //                } else {
                //                    if (h > opts.height) {
                //                        scale = opts.height / h; opts.width = w * scale;
                //                    }
                //                    else {
                //                        opts.width = w; opts.height = h;
                //                    }
                //                }
                $(canvas).attr({ width: opts.width, height: opts.height });
                /* IOS压缩 */
                if (navigator.userAgent.match(/Mac/i) || navigator.userAgent.match(/iPhone/i)) {
                    context.drawImage(image, 0, 0, opts.width, opts.height);
                    mpImg.render(canvas, { width: opts.width, heigth: opts.height, maxWidth: opts.width, maxHeight: opts.height, quality: opts.quality || 0.8, orientation: 1 });
                    dataURL = canvas.toDataURL('image/jpeg', opts.quality || 0.8);
                } /* 安卓设备压缩 */
                else if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/Linux/i)) {
                    var encoder = new JPEGEncoder();
                    $(canvas).attr({ width: opts.width, height: opts.height });
                    context.drawImage(image, 0, 0, opts.width, opts.height);
                    dataURL = encoder.encode(context.getImageData(0, 0, opts.width, opts.height), opts.quality * 100 || 80);
                } else {
                    context.drawImage(image, 0, 0, opts.width, opts.height);
                    dataURL = canvas.toDataURL('image/jpeg', opts.quality || 0.8);
                }
                /* 下面两行不能互换，在安桌下会出现上传不去图片的问题；ios下没问题 */
                uploadImgNew(dataURL);
                canvas.remove();
            };
        };

        /* 上传图片 */
        function uploadImgNew(pic) {
            var base64 = pic.split(',')[1]; /* 这里面是base64字符串 */
            var formData = new FormData();
            formData.append('base64Data', base64);
            formData.append('fileName', fileinfo["name"]);
            formData.append('fileSize', fileinfo["size"]);
            var xhr = new XMLHttpRequest();
            xhr.open(/* method */"POST", /* target url */opts.sendurl/*, async, default to true */);
            xhr.send(formData);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        var resData = eval("(" + xhr.responseText + ")");
                        if (resData.code == 1) {
                            ithis.uploadSuccess(curIndex, resData.datas.rows);
                        }
                        else {
                            alert(resData.msg);
                            uploadError(curIndex);
                        }
                    }
                    else {
                        uploadError(curIndex);
                    }
                }
            }
        };
    };

    /* 图片上传成功 */
    this.uploadSuccess = function (index, imgUrl) {
        $('#Album-item-' + curIndex).find('input[name="hid_photo_info"]').val(imgUrl);
        $('#Album-item-' + curIndex).find(".img-box").html('<img src="' + opts.remote + imgUrl + '" />');
        curIndex++;
        i++;
        ithis.lastImgCount();
        ithis.compressUploadImg();
        if (i == fileCount) {//上传到最后一张
            ithis.SaveImgs();
        }
    };

    /* 图片上传失败 */
    this.uploadError = function (index) {
        $('#Album-item-' + curIndex).find(".img-box").html('<div class="img-fail">上传失败</div>');
        curIndex++;
        i++;
        ithis.compressUploadImg();
    };

    /* 计算已经上传多少张图片 */
    this.reCount = function () {
        curImgCount = AlbumList.find('img').length;
        if (curImgCount === opts.maxPicCount) {
            addUploadLi.hide();
        } else {
            addUploadLi.show();
        }
    };

    /* 实时显示可上传图片数量 */
    this.lastImgCount = function () {

    };

    /* 删除当前图片 @index 图片索引 */
    this.clearImg = function (index) {
        $('#Album-item-' + index).remove();
        ithis.reCount();
        lastImgNum--;
        ithis.lastImgCount();
        isUploading = false;
        ithis.SaveImgs();
    };

    /*保存图片*/
    this.SaveImgs = function () {
        //将图片存入cookie
        var photoArr = $('.Album-item').find('input[name="hid_photo_info"]'), imgList = '';
        if (photoArr.length > 0) {
            for (var z = 0; z < photoArr.length; z++) {
                imgList += $(photoArr[z]).val() + ',';
            }
            if (imgList.length > 0) {
                imgList = imgList.substr(0, imgList.length - 1);
                addCookie('imgscookie', imgList, 2);
            }
        }
        else {
            addCookie('imgscookie', '', -1);
        }
    };

    /************************* APP UploadImage Function  APP上传图片接口2014年8月19日 ******/
    this.appOpenImgDialogue = function () {
        window.androidApp.uploadFile('');
    };

    this.setSpecialVersion = function (t) {
        if (t == 1) {
            ithis.specialVersion = true;
        }
    };
};
var uploadCarPic = new UploadCarImage();
uploadCarPic.init();//初始化
uploadCarPic.loadModify();//加载修改

/* jpeg编码函数 */
function JPEGEncoder(quality) {
    var self = this;
    var fround = Math.round;
    var ffloor = Math.floor;
    var YTable = new Array(64);
    var UVTable = new Array(64);
    var fdtbl_Y = new Array(64);
    var fdtbl_UV = new Array(64);
    var YDC_HT;
    var UVDC_HT;
    var YAC_HT;
    var UVAC_HT;

    var bitcode = new Array(65535);
    var category = new Array(65535);
    var outputfDCTQuant = new Array(64);
    var DU = new Array(64);
    var byteout = [];
    var bytenew = 0;
    var bytepos = 7;

    var YDU = new Array(64);
    var UDU = new Array(64);
    var VDU = new Array(64);
    var clt = new Array(256);
    var RGB_YUV_TABLE = new Array(2048);
    var currentQuality;

    var ZigZag = [
                 0, 1, 5, 6, 14, 15, 27, 28,
                 2, 4, 7, 13, 16, 26, 29, 42,
                 3, 8, 12, 17, 25, 30, 41, 43,
                 9, 11, 18, 24, 31, 40, 44, 53,
                10, 19, 23, 32, 39, 45, 52, 54,
                20, 22, 33, 38, 46, 51, 55, 60,
                21, 34, 37, 47, 50, 56, 59, 61,
                35, 36, 48, 49, 57, 58, 62, 63
            ];

    var std_dc_luminance_nrcodes = [0, 0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
    var std_dc_luminance_values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    var std_ac_luminance_nrcodes = [0, 0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d];
    var std_ac_luminance_values = [
                0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12,
                0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07,
                0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
                0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0,
                0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a, 0x16,
                0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
                0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39,
                0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49,
                0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
                0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69,
                0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79,
                0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
                0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98,
                0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7,
                0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6,
                0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5,
                0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4,
                0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
                0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea,
                0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8,
                0xf9, 0xfa
            ];

    var std_dc_chrominance_nrcodes = [0, 0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
    var std_dc_chrominance_values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    var std_ac_chrominance_nrcodes = [0, 0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 0x77];
    var std_ac_chrominance_values = [
                0x00, 0x01, 0x02, 0x03, 0x11, 0x04, 0x05, 0x21,
                0x31, 0x06, 0x12, 0x41, 0x51, 0x07, 0x61, 0x71,
                0x13, 0x22, 0x32, 0x81, 0x08, 0x14, 0x42, 0x91,
                0xa1, 0xb1, 0xc1, 0x09, 0x23, 0x33, 0x52, 0xf0,
                0x15, 0x62, 0x72, 0xd1, 0x0a, 0x16, 0x24, 0x34,
                0xe1, 0x25, 0xf1, 0x17, 0x18, 0x19, 0x1a, 0x26,
                0x27, 0x28, 0x29, 0x2a, 0x35, 0x36, 0x37, 0x38,
                0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48,
                0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58,
                0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68,
                0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78,
                0x79, 0x7a, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87,
                0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96,
                0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5,
                0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4,
                0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3,
                0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2,
                0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda,
                0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9,
                0xea, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8,
                0xf9, 0xfa
            ];

    function initQuantTables(sf) {
        var YQT = [
                    16, 11, 10, 16, 24, 40, 51, 61,
                    12, 12, 14, 19, 26, 58, 60, 55,
                    14, 13, 16, 24, 40, 57, 69, 56,
                    14, 17, 22, 29, 51, 87, 80, 62,
                    18, 22, 37, 56, 68, 109, 103, 77,
                    24, 35, 55, 64, 81, 104, 113, 92,
                    49, 64, 78, 87, 103, 121, 120, 101,
                    72, 92, 95, 98, 112, 100, 103, 99
                ];

        for (var i = 0; i < 64; i++) {
            var t = ffloor((YQT[i] * sf + 50) / 100);
            if (t < 1) {
                t = 1;
            } else if (t > 255) {
                t = 255;
            }
            YTable[ZigZag[i]] = t;
        }
        var UVQT = [
                    17, 18, 24, 47, 99, 99, 99, 99,
                    18, 21, 26, 66, 99, 99, 99, 99,
                    24, 26, 56, 99, 99, 99, 99, 99,
                    47, 66, 99, 99, 99, 99, 99, 99,
                    99, 99, 99, 99, 99, 99, 99, 99,
                    99, 99, 99, 99, 99, 99, 99, 99,
                    99, 99, 99, 99, 99, 99, 99, 99,
                    99, 99, 99, 99, 99, 99, 99, 99
                ];
        for (var j = 0; j < 64; j++) {
            var u = ffloor((UVQT[j] * sf + 50) / 100);
            if (u < 1) {
                u = 1;
            } else if (u > 255) {
                u = 255;
            }
            UVTable[ZigZag[j]] = u;
        }
        var aasf = [
                    1.0, 1.387039845, 1.306562965, 1.175875602,
                    1.0, 0.785694958, 0.541196100, 0.275899379
                ];
        var k = 0;
        for (var row = 0; row < 8; row++) {
            for (var col = 0; col < 8; col++) {
                fdtbl_Y[k] = (1.0 / (YTable[ZigZag[k]] * aasf[row] * aasf[col] * 8.0));
                fdtbl_UV[k] = (1.0 / (UVTable[ZigZag[k]] * aasf[row] * aasf[col] * 8.0));
                k++;
            }
        }
    }

    function computeHuffmanTbl(nrcodes, std_table) {
        var codevalue = 0;
        var pos_in_table = 0;
        var HT = new Array();
        for (var k = 1; k <= 16; k++) {
            for (var j = 1; j <= nrcodes[k]; j++) {
                HT[std_table[pos_in_table]] = [];
                HT[std_table[pos_in_table]][0] = codevalue;
                HT[std_table[pos_in_table]][1] = k;
                pos_in_table++;
                codevalue++;
            }
            codevalue *= 2;
        }
        return HT;
    }

    function initHuffmanTbl() {
        YDC_HT = computeHuffmanTbl(std_dc_luminance_nrcodes, std_dc_luminance_values);
        UVDC_HT = computeHuffmanTbl(std_dc_chrominance_nrcodes, std_dc_chrominance_values);
        YAC_HT = computeHuffmanTbl(std_ac_luminance_nrcodes, std_ac_luminance_values);
        UVAC_HT = computeHuffmanTbl(std_ac_chrominance_nrcodes, std_ac_chrominance_values);
    }

    function initCategoryNumber() {
        var nrlower = 1;
        var nrupper = 2;
        for (var cat = 1; cat <= 15; cat++) {
            //Positive numbers
            for (var nr = nrlower; nr < nrupper; nr++) {
                category[32767 + nr] = cat;
                bitcode[32767 + nr] = [];
                bitcode[32767 + nr][1] = cat;
                bitcode[32767 + nr][0] = nr;
            }
            //Negative numbers
            for (var nrneg = -(nrupper - 1); nrneg <= -nrlower; nrneg++) {
                category[32767 + nrneg] = cat;
                bitcode[32767 + nrneg] = [];
                bitcode[32767 + nrneg][1] = cat;
                bitcode[32767 + nrneg][0] = nrupper - 1 + nrneg;
            }
            nrlower <<= 1;
            nrupper <<= 1;
        }
    }

    function initRGBYUVTable() {
        for (var i = 0; i < 256; i++) {
            RGB_YUV_TABLE[i] = 19595 * i;
            RGB_YUV_TABLE[(i + 256) >> 0] = 38470 * i;
            RGB_YUV_TABLE[(i + 512) >> 0] = 7471 * i + 0x8000;
            RGB_YUV_TABLE[(i + 768) >> 0] = -11059 * i;
            RGB_YUV_TABLE[(i + 1024) >> 0] = -21709 * i;
            RGB_YUV_TABLE[(i + 1280) >> 0] = 32768 * i + 0x807FFF;
            RGB_YUV_TABLE[(i + 1536) >> 0] = -27439 * i;
            RGB_YUV_TABLE[(i + 1792) >> 0] = -5329 * i;
        }
    }

    // IO functions
    function writeBits(bs) {
        var value = bs[0];
        var posval = bs[1] - 1;
        while (posval >= 0) {
            if (value & (1 << posval)) {
                bytenew |= (1 << bytepos);
            }
            posval--;
            bytepos--;
            if (bytepos < 0) {
                if (bytenew == 0xFF) {
                    writeByte(0xFF);
                    writeByte(0);
                }
                else {
                    writeByte(bytenew);
                }
                bytepos = 7;
                bytenew = 0;
            }
        }
    }

    function writeByte(value) {
        byteout.push(clt[value]); // write char directly instead of converting later
    }

    function writeWord(value) {
        writeByte((value >> 8) & 0xFF);
        writeByte((value) & 0xFF);
    }

    // DCT & quantization core
    function fDCTQuant(data, fdtbl) {
        var d0, d1, d2, d3, d4, d5, d6, d7;
        /* Pass 1: process rows. */
        var dataOff = 0;
        var i;
        var I8 = 8;
        var I64 = 64;
        for (i = 0; i < I8; ++i) {
            d0 = data[dataOff];
            d1 = data[dataOff + 1];
            d2 = data[dataOff + 2];
            d3 = data[dataOff + 3];
            d4 = data[dataOff + 4];
            d5 = data[dataOff + 5];
            d6 = data[dataOff + 6];
            d7 = data[dataOff + 7];

            var tmp0 = d0 + d7;
            var tmp7 = d0 - d7;
            var tmp1 = d1 + d6;
            var tmp6 = d1 - d6;
            var tmp2 = d2 + d5;
            var tmp5 = d2 - d5;
            var tmp3 = d3 + d4;
            var tmp4 = d3 - d4;

            /* Even part */
            var tmp10 = tmp0 + tmp3;    /* phase 2 */
            var tmp13 = tmp0 - tmp3;
            var tmp11 = tmp1 + tmp2;
            var tmp12 = tmp1 - tmp2;

            data[dataOff] = tmp10 + tmp11; /* phase 3 */
            data[dataOff + 4] = tmp10 - tmp11;

            var z1 = (tmp12 + tmp13) * 0.707106781; /* c4 */
            data[dataOff + 2] = tmp13 + z1; /* phase 5 */
            data[dataOff + 6] = tmp13 - z1;

            /* Odd part */
            tmp10 = tmp4 + tmp5; /* phase 2 */
            tmp11 = tmp5 + tmp6;
            tmp12 = tmp6 + tmp7;

            /* The rotator is modified from fig 4-8 to avoid extra negations. */
            var z5 = (tmp10 - tmp12) * 0.382683433; /* c6 */
            var z2 = 0.541196100 * tmp10 + z5; /* c2-c6 */
            var z4 = 1.306562965 * tmp12 + z5; /* c2+c6 */
            var z3 = tmp11 * 0.707106781; /* c4 */

            var z11 = tmp7 + z3;    /* phase 5 */
            var z13 = tmp7 - z3;

            data[dataOff + 5] = z13 + z2; /* phase 6 */
            data[dataOff + 3] = z13 - z2;
            data[dataOff + 1] = z11 + z4;
            data[dataOff + 7] = z11 - z4;

            dataOff += 8; /* advance pointer to next row */
        }

        /* Pass 2: process columns. */
        dataOff = 0;
        for (i = 0; i < I8; ++i) {
            d0 = data[dataOff];
            d1 = data[dataOff + 8];
            d2 = data[dataOff + 16];
            d3 = data[dataOff + 24];
            d4 = data[dataOff + 32];
            d5 = data[dataOff + 40];
            d6 = data[dataOff + 48];
            d7 = data[dataOff + 56];

            var tmp0p2 = d0 + d7;
            var tmp7p2 = d0 - d7;
            var tmp1p2 = d1 + d6;
            var tmp6p2 = d1 - d6;
            var tmp2p2 = d2 + d5;
            var tmp5p2 = d2 - d5;
            var tmp3p2 = d3 + d4;
            var tmp4p2 = d3 - d4;

            /* Even part */
            var tmp10p2 = tmp0p2 + tmp3p2;  /* phase 2 */
            var tmp13p2 = tmp0p2 - tmp3p2;
            var tmp11p2 = tmp1p2 + tmp2p2;
            var tmp12p2 = tmp1p2 - tmp2p2;

            data[dataOff] = tmp10p2 + tmp11p2; /* phase 3 */
            data[dataOff + 32] = tmp10p2 - tmp11p2;

            var z1p2 = (tmp12p2 + tmp13p2) * 0.707106781; /* c4 */
            data[dataOff + 16] = tmp13p2 + z1p2; /* phase 5 */
            data[dataOff + 48] = tmp13p2 - z1p2;

            /* Odd part */
            tmp10p2 = tmp4p2 + tmp5p2; /* phase 2 */
            tmp11p2 = tmp5p2 + tmp6p2;
            tmp12p2 = tmp6p2 + tmp7p2;

            /* The rotator is modified from fig 4-8 to avoid extra negations. */
            var z5p2 = (tmp10p2 - tmp12p2) * 0.382683433; /* c6 */
            var z2p2 = 0.541196100 * tmp10p2 + z5p2; /* c2-c6 */
            var z4p2 = 1.306562965 * tmp12p2 + z5p2; /* c2+c6 */
            var z3p2 = tmp11p2 * 0.707106781; /* c4 */

            var z11p2 = tmp7p2 + z3p2;  /* phase 5 */
            var z13p2 = tmp7p2 - z3p2;

            data[dataOff + 40] = z13p2 + z2p2; /* phase 6 */
            data[dataOff + 24] = z13p2 - z2p2;
            data[dataOff + 8] = z11p2 + z4p2;
            data[dataOff + 56] = z11p2 - z4p2;

            dataOff++; /* advance pointer to next column */
        }

        // Quantize/descale the coefficients
        var fDCTQuant;
        for (i = 0; i < I64; ++i) {
            // Apply the quantization and scaling factor & Round to nearest integer
            fDCTQuant = data[i] * fdtbl[i];
            outputfDCTQuant[i] = (fDCTQuant > 0.0) ? ((fDCTQuant + 0.5) | 0) : ((fDCTQuant - 0.5) | 0);
            //outputfDCTQuant[i] = fround(fDCTQuant);

        }
        return outputfDCTQuant;
    }

    function writeAPP0() {
        writeWord(0xFFE0); // marker
        writeWord(16); // length
        writeByte(0x4A); // J
        writeByte(0x46); // F
        writeByte(0x49); // I
        writeByte(0x46); // F
        writeByte(0); // = "JFIF",'\0'
        writeByte(1); // versionhi
        writeByte(1); // versionlo
        writeByte(0); // xyunits
        writeWord(1); // xdensity
        writeWord(1); // ydensity
        writeByte(0); // thumbnwidth
        writeByte(0); // thumbnheight
    }

    function writeSOF0(width, height) {
        writeWord(0xFFC0); // marker
        writeWord(17);   // length, truecolor YUV JPG
        writeByte(8);    // precision
        writeWord(height);
        writeWord(width);
        writeByte(3);    // nrofcomponents
        writeByte(1);    // IdY
        writeByte(0x11); // HVY
        writeByte(0);    // QTY
        writeByte(2);    // IdU
        writeByte(0x11); // HVU
        writeByte(1);    // QTU
        writeByte(3);    // IdV
        writeByte(0x11); // HVV
        writeByte(1);    // QTV
    }

    function writeDQT() {
        writeWord(0xFFDB); // marker
        writeWord(132);    // length
        writeByte(0);
        for (var i = 0; i < 64; i++) {
            writeByte(YTable[i]);
        }
        writeByte(1);
        for (var j = 0; j < 64; j++) {
            writeByte(UVTable[j]);
        }
    }

    function writeDHT() {
        writeWord(0xFFC4); // marker
        writeWord(0x01A2); // length

        writeByte(0); // HTYDCinfo
        for (var i = 0; i < 16; i++) {
            writeByte(std_dc_luminance_nrcodes[i + 1]);
        }
        for (var j = 0; j <= 11; j++) {
            writeByte(std_dc_luminance_values[j]);
        }

        writeByte(0x10); // HTYACinfo
        for (var k = 0; k < 16; k++) {
            writeByte(std_ac_luminance_nrcodes[k + 1]);
        }
        for (var l = 0; l <= 161; l++) {
            writeByte(std_ac_luminance_values[l]);
        }

        writeByte(1); // HTUDCinfo
        for (var m = 0; m < 16; m++) {
            writeByte(std_dc_chrominance_nrcodes[m + 1]);
        }
        for (var n = 0; n <= 11; n++) {
            writeByte(std_dc_chrominance_values[n]);
        }

        writeByte(0x11); // HTUACinfo
        for (var o = 0; o < 16; o++) {
            writeByte(std_ac_chrominance_nrcodes[o + 1]);
        }
        for (var p = 0; p <= 161; p++) {
            writeByte(std_ac_chrominance_values[p]);
        }
    }

    function writeSOS() {
        writeWord(0xFFDA); // marker
        writeWord(12); // length
        writeByte(3); // nrofcomponents
        writeByte(1); // IdY
        writeByte(0); // HTY
        writeByte(2); // IdU
        writeByte(0x11); // HTU
        writeByte(3); // IdV
        writeByte(0x11); // HTV
        writeByte(0); // Ss
        writeByte(0x3f); // Se
        writeByte(0); // Bf
    }

    function processDU(CDU, fdtbl, DC, HTDC, HTAC) {
        var EOB = HTAC[0x00];
        var M16zeroes = HTAC[0xF0];
        var pos;
        var I16 = 16;
        var I63 = 63;
        var I64 = 64;
        var DU_DCT = fDCTQuant(CDU, fdtbl);
        //ZigZag reorder
        for (var j = 0; j < I64; ++j) {
            DU[ZigZag[j]] = DU_DCT[j];
        }
        var Diff = DU[0] - DC; DC = DU[0];
        //Encode DC
        if (Diff == 0) {
            writeBits(HTDC[0]); // Diff might be 0
        } else {
            pos = 32767 + Diff;
            writeBits(HTDC[category[pos]]);
            writeBits(bitcode[pos]);
        }
        //Encode ACs
        var end0pos = 63; // was const... which is crazy
        for (; (end0pos > 0) && (DU[end0pos] == 0); end0pos--) { };
        //end0pos = first element in reverse order !=0
        if (end0pos == 0) {
            writeBits(EOB);
            return DC;
        }
        var i = 1;
        var lng;
        while (i <= end0pos) {
            var startpos = i;
            for (; (DU[i] == 0) && (i <= end0pos); ++i) { }
            var nrzeroes = i - startpos;
            if (nrzeroes >= I16) {
                lng = nrzeroes >> 4;
                for (var nrmarker = 1; nrmarker <= lng; ++nrmarker)
                    writeBits(M16zeroes);
                nrzeroes = nrzeroes & 0xF;
            }
            pos = 32767 + DU[i];
            writeBits(HTAC[(nrzeroes << 4) + category[pos]]);
            writeBits(bitcode[pos]);
            i++;
        }
        if (end0pos != I63) {
            writeBits(EOB);
        }
        return DC;
    }

    function initCharLookupTable() {
        var sfcc = String.fromCharCode;
        for (var i = 0; i < 256; i++) { ///// ACHTUNG // 255
            clt[i] = sfcc(i);
        }
    }

    this.encode = function (image, quality) // image data object
    {
        // var time_start = new Date().getTime();

        if (quality) setQuality(quality);

        // Initialize bit writer
        byteout = new Array();
        bytenew = 0;
        bytepos = 7;

        // Add JPEG headers
        writeWord(0xFFD8); // SOI
        writeAPP0();
        writeDQT();
        writeSOF0(image.width, image.height);
        writeDHT();
        writeSOS();


        // Encode 8x8 macroblocks
        var DCY = 0;
        var DCU = 0;
        var DCV = 0;

        bytenew = 0;
        bytepos = 7;


        this.encode.displayName = "_encode_";

        var imageData = image.data;
        var width = image.width;
        var height = image.height;

        var quadWidth = width * 4;
        var tripleWidth = width * 3;

        var x, y = 0;
        var r, g, b;
        var start, p, col, row, pos;
        while (y < height) {
            x = 0;
            while (x < quadWidth) {
                start = quadWidth * y + x;
                p = start;
                col = -1;
                row = 0;

                for (pos = 0; pos < 64; pos++) {
                    row = pos >> 3; // /8
                    col = (pos & 7) * 4; // %8
                    p = start + (row * quadWidth) + col;

                    if (y + row >= height) { // padding bottom
                        p -= (quadWidth * (y + 1 + row - height));
                    }

                    if (x + col >= quadWidth) { // padding right
                        p -= ((x + col) - quadWidth + 4)
                    }

                    r = imageData[p++];
                    g = imageData[p++];
                    b = imageData[p++];


                    /* // calculate YUV values dynamically
                    YDU[pos]=((( 0.29900)*r+( 0.58700)*g+( 0.11400)*b))-128; //-0x80
                    UDU[pos]=(((-0.16874)*r+(-0.33126)*g+( 0.50000)*b));
                    VDU[pos]=((( 0.50000)*r+(-0.41869)*g+(-0.08131)*b));
                    */

                    // use lookup table (slightly faster)
                    YDU[pos] = ((RGB_YUV_TABLE[r] + RGB_YUV_TABLE[(g + 256) >> 0] + RGB_YUV_TABLE[(b + 512) >> 0]) >> 16) - 128;
                    UDU[pos] = ((RGB_YUV_TABLE[(r + 768) >> 0] + RGB_YUV_TABLE[(g + 1024) >> 0] + RGB_YUV_TABLE[(b + 1280) >> 0]) >> 16) - 128;
                    VDU[pos] = ((RGB_YUV_TABLE[(r + 1280) >> 0] + RGB_YUV_TABLE[(g + 1536) >> 0] + RGB_YUV_TABLE[(b + 1792) >> 0]) >> 16) - 128;

                }

                DCY = processDU(YDU, fdtbl_Y, DCY, YDC_HT, YAC_HT);
                DCU = processDU(UDU, fdtbl_UV, DCU, UVDC_HT, UVAC_HT);
                DCV = processDU(VDU, fdtbl_UV, DCV, UVDC_HT, UVAC_HT);
                x += 32;
            }
            y += 8;
        }


        ////////////////////////////////////////////////////////////////

        // Do the bit alignment of the EOI marker
        if (bytepos >= 0) {
            var fillbits = [];
            fillbits[1] = bytepos + 1;
            fillbits[0] = (1 << (bytepos + 1)) - 1;
            writeBits(fillbits);
        }

        writeWord(0xFFD9); //EOI

        var jpegDataUri = 'data:image/jpeg;base64,' + btoa(byteout.join(''));

        byteout = [];

        // benchmarking
        // var duration = new Date().getTime() - time_start;
        // console.log('Encoding time: '+ currentQuality + 'ms');
        //

        return jpegDataUri
    }

    function setQuality(quality) {
        if (quality <= 0) {
            quality = 1;
        }
        if (quality > 100) {
            quality = 100;
        }

        if (currentQuality == quality) return // don't recalc if unchanged

        var sf = 0;
        if (quality < 50) {
            sf = Math.floor(5000 / quality);
        } else {
            sf = Math.floor(200 - quality * 2);
        }

        initQuantTables(sf);
        currentQuality = quality;
        // console.log('Quality set to: '+quality +'%');
    }

    function init() {
        // var time_start = new Date().getTime();
        if (!quality) quality = 50;
        // Create tables
        initCharLookupTable()
        initHuffmanTbl();
        initCategoryNumber();
        initRGBYUVTable();

        setQuality(quality);
        // var duration = new Date().getTime() - time_start;
        // console.log('Initialization '+ duration + 'ms');
    }

    init();

};

/* megapix-image.js for IOS(iphone5+) drawImage画面扭曲修复 */
!function(){function a(a){var d,e,b=a.naturalWidth,c=a.naturalHeight;return b*c>1048576?(d=document.createElement("canvas"),d.width=d.height=1,e=d.getContext("2d"),e.drawImage(a,-b+1,0),0===e.getImageData(0,0,1,1).data[3]):!1}function b(a,b,c){var e,f,g,h,i,j,k,d=document.createElement("canvas");for(d.width=1,d.height=c,e=d.getContext("2d"),e.drawImage(a,0,0),f=e.getImageData(0,0,1,c).data,g=0,h=c,i=c;i>g;)j=f[4*(i-1)+3],0===j?h=i:g=i,i=h+g>>1;return k=i/c,0===k?1:k}function c(a,b,c){var e=document.createElement("canvas");return d(a,e,b,c),e.toDataURL("image/jpeg",b.quality||.8)}function d(c,d,f,g){var m,n,o,p,q,r,s,t,u,v,w,h=c.naturalWidth,i=c.naturalHeight,j=f.width,k=f.height,l=d.getContext("2d");for(l.save(),e(d,l,j,k,f.orientation),m=a(c),m&&(h/=2,i/=2),n=1024,o=document.createElement("canvas"),o.width=o.height=n,p=o.getContext("2d"),q=g?b(c,h,i):1,r=Math.ceil(n*j/h),s=Math.ceil(n*k/i/q),t=0,u=0;i>t;){for(v=0,w=0;h>v;)p.clearRect(0,0,n,n),p.drawImage(c,-v,-t),l.drawImage(o,0,0,n,n,w,u,r,s),v+=n,w+=r;t+=n,u+=s}l.restore(),o=p=null}function e(a,b,c,d,e){switch(e){case 5:case 6:case 7:case 8:a.width=d,a.height=c;break;default:a.width=c,a.height=d}switch(e){case 2:b.translate(c,0),b.scale(-1,1);break;case 3:b.translate(c,d),b.rotate(Math.PI);break;case 4:b.translate(0,d),b.scale(1,-1);break;case 5:b.rotate(.5*Math.PI),b.scale(1,-1);break;case 6:b.rotate(.5*Math.PI),b.translate(0,-d);break;case 7:b.rotate(.5*Math.PI),b.translate(c,-d),b.scale(-1,1);break;case 8:b.rotate(-.5*Math.PI),b.translate(-c,0)}}function f(a){var b,c,d;if(window.Blob&&a instanceof Blob){if(b=new Image,c=window.URL&&window.URL.createObjectURL?window.URL:window.webkitURL&&window.webkitURL.createObjectURL?window.webkitURL:null,!c)throw Error("No createObjectURL function found to create blob url");b.src=c.createObjectURL(a),this.blob=a,a=b}a.naturalWidth||a.naturalHeight||(d=this,a.onload=function(){var b,c,a=d.imageLoadListeners;if(a)for(d.imageLoadListeners=null,b=0,c=a.length;c>b;b++)a[b]()},this.imageLoadListeners=[]),this.srcImage=a}f.prototype.render=function(a,b){var e,f,g,h,i,j,k,l,m,n,o;if(this.imageLoadListeners)return e=this,this.imageLoadListeners.push(function(){e.render(a,b)}),void 0;b=b||{},f=this.srcImage.naturalWidth,g=this.srcImage.naturalHeight,h=b.width,i=b.height,j=b.maxWidth,k=b.maxHeight,l=!this.blob||"image/jpeg"===this.blob.type,h&&!i?i=g*h/f<<0:i&&!h?h=f*i/g<<0:(h=f,i=g),j&&h>j&&(h=j,i=g*h/f<<0),k&&i>k&&(i=k,h=f*i/g<<0),m={width:h,height:i};for(n in b)m[n]=b[n];o=a.tagName.toLowerCase(),"img"===o?a.src=c(this.srcImage,m,l):"canvas"===o&&d(this.srcImage,a,m,l),"function"==typeof this.onrender&&this.onrender(a)},"function"==typeof define&&define.amd?define([],function(){return f}):this.MegaPixImage=f}();
