import express from "express";
import {
  S3Client,
  ListBucketsCommand,
  ListObjectsCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import cors from "cors";
import multer from "multer";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const AWS_REGION = "ap-northeast-1";
const s3Client = new S3Client({ region: AWS_REGION });

app.use(cors());
app.use(express.json());

const router = express.Router();

// バケットリストを取得
router.get("/storage/buckets", async (req, res) => {
  try {
    const data = await s3Client.send(new ListBucketsCommand({}));
    // バケット名のみのリストを返す
    const bucketNames = data.Buckets.map((bucket) => bucket.Name);
    res.json(bucketNames);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 指定バケットのファイルリストを取得
router.get("/storage/:bucket/files", async (req, res) => {
  try {
    const { bucket } = req.params;
    const data = await s3Client.send(
      new ListObjectsCommand({ Bucket: bucket })
    );
    res.json(data.Contents.map((file) => file.Key));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 指定バケット、ファイル名のファイルを取得
router.get("/storage/:bucket/file/:filename", async (req, res) => {
  try {
    const { bucket, filename } = req.params;
    const data = await s3Client.send(
      new GetObjectCommand({ Bucket: bucket, Key: filename })
    );
    const stream = data.Body;
    stream.on("data", (chunk) => res.write(chunk));
    stream.on("end", () => res.end());
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 指定バケットのファイルを削除
router.delete("/storage/:bucket/file/:filename", async (req, res) => {
  try {
    const { bucket, filename } = req.params;
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: filename })
    );
    res.send(`File ${filename} deleted successfully`);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ファイルをS3に保存
router.put(
  "/storage/:bucket/file/:filename",
  upload.single("file"),
  async (req, res) => {
    try {
      const { bucket, filename } = req.params;
      const file = req.file;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: filename,
          Body: file.buffer,
        })
      );
      const url =
        `https://${bucket}.s3.${AWS_REGION}.amazonaws.com/${filename}`;
      res.json({ url });
    } catch (err) {
      res.status(500).send(err.message);
    }
  }
);

app.use("/", router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
