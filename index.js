const AWS = require('aws-sdk');
const sharp = require('sharp');

// 创建 S3 客户端实例
const s3 = new AWS.S3();

// Lambda 处理程序
exports.handler = async (event) => {
  let compressedImageBuffer;
  console.log("......... start");
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(event.Records[0].s3.object.key);
  console.log("the image is :" + key);

  try {
    // 下载原始图像文件
    const originalImage = await s3.getObject({ Bucket: bucket, Key: key }).promise();

    // 检测图像格式
    const imageMetadata = await sharp(originalImage.Body, { animated: true, limitInputPixels: false }).metadata();
    const format = imageMetadata.format.toLowerCase();

    // 限制压缩的图片格式范围
    const allowedFormats = ['png', 'avif', 'jpeg', 'webp', 'jpg'];

    if (!allowedFormats.includes(format)) {
      console.log(`Unsupported image format: ${format}`);
      // 对于不支持的格式，直接将原始图片复制到目标目录
      const targetKey = key.replace('source-images/', 'target-images/');
      await s3
        .copyObject({
          Bucket: bucket,
          CopySource: `${bucket}/${key}`,
          Key: targetKey,
        })
        .promise();

      console.log(".........put file to s3 end");
      console.log("......... end");

      return {
        statusCode: 200,
        body: 'Image c successful',
      };
    }

    // 根据图像格式调整压缩选项
    let compressionOptions = {};
    if (format === 'jpeg' || format === 'jpg') {
      compressionOptions = { quality: 70 };
    } else if (format === 'png') {
      compressionOptions = { quality: 70, lossless: true };
    } else if (format === 'webp') {
      compressionOptions = { quality: 70, animated: true };
    } else if (format === 'avif') {
      compressionOptions = { lossless: true, quality: 70 };
    }

    console.log(".........compress start");
    // 使用 Sharp 进行无损压缩
    compressedImageBuffer = await sharp(originalImage.Body, { limitInputPixels: false })
      .toFormat(format, compressionOptions)
      .toBuffer();
    console.log(".........compress end");

    console.log(".........put file to s3 start");

    // 构建目标文件的 Key（路径）
    const targetKey = key.replace('source-images/', 'target-images/');

    // 将处理后的图片上传到同一个存储桶的目标文件夹
    await s3
      .putObject({
        Body: compressedImageBuffer,
        Bucket: bucket,
        Key: targetKey,
      })
      .promise();

    console.log(".........put file to s3 end");
    console.log("......... end");

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
