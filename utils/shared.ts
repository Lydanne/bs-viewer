"use client";
import type { IOpenAttachment } from "@lark-base-open/js-sdk";

export async function fileToIOpenAttachment(
  base: any,
  file: File
): Promise<IOpenAttachment> {
  const tokens = await base.batchUploadFile([file]);
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    token: tokens[0],
    timeStamp: file.lastModified,
  };
}
// function downloadFile(file: Blob | MediaSource) {
//   const downloadLink = document.createElement("a");
//   downloadLink.href = URL.createObjectURL(file);
//   downloadLink.download = file.name;
//   downloadLink.click();
// }
export function fileToURL(file: Blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}
export async function canvasToFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  fileType = "image/png"
) {
  // 获取Canvas上的图像数据（这里假设图像数据为DataURL）
  // const imageDataURL = canvas.toDataURL(fileType);

  // // 将DataURL转换为Blob对象
  // const blob = dataURLToBlob(imageDataURL);

  const blob: Blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("canvas to blob error"));
      resolve(blob);
    }, fileType, 1);
  })

  // 创建File对象
  const file = new File([blob], fileName, { type: fileType });

  return file;
}
// 将DataURL转换为Blob对象的辅助函数
function dataURLToBlob(dataURL: string) {
  const byteString = atob(dataURL.split(",")[1]);
  const mimeString = dataURL.split(",")[0].split(":")[1].split(";")[0];
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  return new Blob([arrayBuffer], { type: mimeString });
}

export function base64ToFile(base64: string, filename: string, mimeType: string) {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  // eslint-disable-next-line no-plusplus
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mimeType });
}
export function downloadFile(file: File) {
  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(file);
  downloadLink.download = file.name;
  downloadLink.click();
}