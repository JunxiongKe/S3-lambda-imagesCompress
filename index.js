const AWS = require('aws-sdk');
const sharp = require('sharp');

// 创建 S3 客户端实例
const s3 = new AWS.S3();

// Lambda 处理程序
exports.handler = async (event) => {
  let compressedImageBuffer;
  console.log(".........compress start");  
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(event.Records[0].s3.object.key);
  console.log("the image is :" + key);


  try {
    // 下载原始图像文件
    const originalImage = await s3.getObject({ Bucket: bucket, Key: key }).promise();

    // 检测图像格式
    const imageMetadata = await sharp(originalImage.Body, { animated: true ,limitInputPixels: false}).metadata();


    //const format = await sharp(originalImage.Body,{ animated: true ,limitInputPixels: false}).metadata().then((metadata) => metadata.format);

    const originalWidth = imageMetadata.width;
    const originalHeight = imageMetadata.pageHeight;
    const format = imageMetadata.format;

    // 限制压缩的图片格式范围
    const allowedFormats = ['png', 'gif', 'jpeg', 'webp'];

    if (!allowedFormats.includes(format)) {
      console.log(`Unsupported image format: ${format}`);
      return {
        statusCode: 400,
        body: 'Unsupported image format',
      };
    }

    // 设置默认压缩选项
    let compressionOptions = {
      lossless: true,
    };

    // 根据图像格式调整压缩选项
    if (format === 'jpeg' || format === 'jpg') {
      compressionOptions = { quality: 70 };
    } else if (format === 'png') {
      compressionOptions = { compressionLevel: 7, lossless: true };
    } else if (format === 'webp') {
      compressionOptions = { quality: 70,lossless: true ,animated: true};
    } else if (format === 'gif') {
      compressionOptions = { lossless: true, colors: 256, animated: true };
    }
    
    if (format === 'gif') {
      console.log(".........gif format compress start");  
      // 获取GIF的元数据

      const targetWidth = Math.floor(originalWidth * 0.3);
      const targetHeight = Math.floor(originalHeight * 0.3);

      // 使用Sharp库调整GIF的尺寸并压缩
      compressedImageBuffer = await sharp(originalImage.Body, { animated: true ,limitInputPixels: false ,effort : 1})
        .resize(targetWidth, targetHeight)
        .toBuffer();
      console.log(".........gif format compress end");  
    } else {
      console.log(".........other format compress start");  
      // 使用 Sharp 进行无损压缩
      compressedImageBuffer = await sharp(originalImage.Body,{ limitInputPixels: false, effort : 1})
        .toFormat(format, compressionOptions)
        .toBuffer();
      console.log(".........other format compress end");    
    }

    // 构建目标文件的 Key（路径）
    const targetKey = key.replace('source-images/', 'target-images/');

    // 将处理后的GIF图像上传到同一个存储桶的目标文件夹
    await s3
      .putObject({
        Body: compressedImageBuffer,
        Bucket: bucket,
        Key: targetKey,
      })
      .promise();

    console.log(".........compress end");

    return {
      statusCode: 200,
      body: 'Image compression successful',
    };
  } catch (error) {
    console.error('Error compressing image:', error);
    return {
      statusCode: 500,
      body: 'Image compression failed',
    };
  }
};
