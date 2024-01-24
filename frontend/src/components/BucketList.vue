<template>
  <div>
    <h1>AWS S3 Explorer</h1>
    <div>
      <select v-model="selectedBucket" @change="fetchFiles">
        <option disabled value="">Select a bucket</option>
        <option v-for="bucket in buckets" :key="bucket" :value="bucket">
          {{ bucket }}
        </option>
      </select>
      <button @click="deleteBucket">Delete Bucket</button>
    </div>
    <div>
      <ul>
        <li v-for="file in files" :key="file">
          {{ file }}
          <button @click="deleteFile(file)">Delete File</button>
        </li>
      </ul>
    </div>
    <div>
      <input type="file" @change="selectFile" />
      <button @click="uploadFile">Upload File</button>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      buckets: [],
      files: [],
      selectedBucket: "",
      selectedFile: null,
    };
  },
  created() {
    this.fetchBuckets();
  },
  methods: {
    async fetchBuckets() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/storage/buckets`
        );
        this.buckets = response.data;
      } catch (error) {
        console.error(error);
      }
    },
    async fetchFiles() {
      if (!this.selectedBucket) return;
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/storage/${this.selectedBucket}/files`
        );
        this.files = response.data;
      } catch (error) {
        console.error(error);
      }
    },
    async deleteBucket() {
      // バケット削除のロジックをここに実装
    },
    async deleteFile(filename) {
      try {
        await axios.delete(
          `${process.env.VUE_APP_API_URL}/storage/${this.selectedBucket}/file/${filename}`
        );
        this.fetchFiles(); // ファイルリストを更新
      } catch (error) {
        console.error(error);
      }
    },
    selectFile(event) {
      this.selectedFile = event.target.files[0];
    },
    async uploadFile() {
      if (!this.selectedFile || !this.selectedBucket) return;
      const formData = new FormData();
      formData.append("file", this.selectedFile);

      try {
        await axios.put(
          `${process.env.VUE_APP_API_URL}/storage/${this.selectedBucket}/file/${this.selectedFile.name}`,
          formData
        );
        this.fetchFiles(); // ファイルリストを更新
      } catch (error) {
        console.error(error);
      }
    },
  },
};
</script>
