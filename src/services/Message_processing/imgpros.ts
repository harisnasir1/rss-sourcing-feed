import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';
export class ImgProcessing{
    private AccessKey:string;
    private SecretKey:string;
    private Region:string;
    private Bucketname:string;
    private s3:S3Client;
    constructor ()
    {
        this.AccessKey=process.env.AccessKey ||"",
        this.SecretKey=process.env.SecretKey||"",
        this.Region=process.env.Region||"",
        this.Bucketname=process.env.BucketName||""
        this.s3=new S3Client({
        credentials:{
        accessKeyId:this.AccessKey,
        secretAccessKey:this.SecretKey,
        },
        region:this.Region
        });;
        console.log("s3 established!",this.Region)
    }

    public async upload_image(image_url:Buffer)
    {
        const fileName = `${Date.now()}-${uuidv4()}`;
        const key = `FeedSourcing/${fileName}.png`;
        const uploadParams = {
        Bucket:this.Bucketname,
        Key: key,
        Body: image_url,  //<-buffer write  
        ContentType: "image/png",
      };
      (await this.s3).send(new PutObjectCommand(uploadParams));
      return [`https://${this.Bucketname}.s3.${this.Region}.amazonaws.com/${key}`];
    }
   

}