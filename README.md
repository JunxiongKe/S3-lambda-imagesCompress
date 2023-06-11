# S3-lambda-imagesCompress
利用sharp工具包，在Lambda实现图片的压缩，图片格式包含jpeg、png、webp、gif，S3触发Lambda事件执行。

1.安装环境
sudo yum install -y git
sudo yum install -y nodejs

2.初始化
cd S3-lambda-imagesCompress
npm init

3.下载依赖包
cd node_modules
npm install sharp

4.构建压缩包
//进入到S3-lambda-imagesCompress目录，zip生成压缩包
cd ..
zip -r function.zip .

5.上传到AWS Lambda

6.配置Lambda对应的S3触发事件源
