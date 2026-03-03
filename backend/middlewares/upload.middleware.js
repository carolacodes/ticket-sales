import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

function makeImageStorage({ folder, transform = [] }) {
  return new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      if (!file?.mimetype?.startsWith("image/")) {
        const err = new Error("Only image files are allowed");
        err.status = 400;
        throw err;
      }

      return {
        folder,
        resource_type: "image",
        format: "webp",
        transformation: [
          { quality: "auto" },
          { fetch_format: "auto" },
          ...transform,
        ],
      };
    },
  });
}

export const uploadEventBanner = multer({
  storage: makeImageStorage({
    folder: "ticket-sales/events",
    transform: [{ width: 1600, height: 900, crop: "limit" }],
  }),
  limits: { fileSize: 6 * 1024 * 1024 }, // 6MB
});

export const uploadAvatar = multer({
  storage: makeImageStorage({
    folder: "ticket-sales/avatars",
    transform: [{ width: 512, height: 512, crop: "limit" }],
  }),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
});