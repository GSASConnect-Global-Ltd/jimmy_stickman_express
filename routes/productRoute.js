import express from 'express';
import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    searchProducts,
    deleteProduct
} from '../controllers/productController.js';
import { uploadProductImages } from "../middleware/upload.js";

const router = express.Router();

// 1️⃣ Search products (use query params)
router.get('/search', searchProducts);

// 2️⃣ Get all products
router.get('/', getProducts);

// 3️⃣ Get single product by ID
router.get('/:id', getProductById);

// 4️⃣ Create product (with up to 3 images)
router.post('/', uploadProductImages, createProduct);

// 5️⃣ Update product by ID (with up to 3 images)
router.put('/:id', uploadProductImages, updateProduct);

// 6️⃣ Delete product by ID
router.delete('/:id', deleteProduct);

export default router;
