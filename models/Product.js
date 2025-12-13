import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    
    description: { type: String },

    price: { type: Number, required: true },

    brand: { type: String },

    material: { type: String },

    gender: {
        type: String,
        enum: ["Male", "Female", "Unisex"],
        default: "Unisex"
    },

    sizes: {
        type: [String],
        default: []    // e.g ["S","M","L"]
    },

    stockBySize: [
        {
            size: { type: String },
            quantity: { type: Number, default: 0 }
        }
    ],

     colors: {
        type: [
            {
                name: { type: String, required: true },
                value: { type: String, required: true } // Hex code or CSS color
            }
        ],
        default: []
    },
    sku: { type: String, unique: true },

    images: {
        type: [String],
        default: [null, null, null],
        validate: {
            validator: (v) => v.length === 3,
            message: "Images array must always have length 3",
        },
    },

    inStock: { type: Boolean, default: true },

    createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model("Product", productSchema);
export default Product;
