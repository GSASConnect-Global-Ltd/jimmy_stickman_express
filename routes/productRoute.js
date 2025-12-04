import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
  deleteMultipleProducts, 
  filterProducts
} from "../controllers/productController.js";

import { uploadProductImages } from "../middleware/upload.js";

const router = express.Router();

// ⬇ APPLY MULTER MIDDLEWARE HERE
router.post("/", uploadProductImages, createProduct);

router.get("/", getProducts);
router.get("/search", searchProducts);
router.get("/filter", filterProducts);
router.get("/:id", getProductById);
router.put("/:id", uploadProductImages, updateProduct);
router.delete("/:id", deleteProduct);
router.delete("/batch/delete", deleteMultipleProducts);

export default router;
