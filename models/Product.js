import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true  },
    price: { type: Number, required: true,  },
    images:{
        type: [String],
        default:[null, null, null],
        validate: {
        validator: function (v) {
          return v.length === 3;
        },
        message: "Images array must always have length 3",
      },
    },
    description: String,
    inStock: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },

})

const Product = mongoose.model("Product", productSchema);
export default Product