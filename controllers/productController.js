import Product from '../models/Product.js';

// -------------------- CREATE PRODUCT --------------------
export const createProduct = async (req, res) => {
    try{
        const { name, description, price, category, stock } = req.body;
        const uploadedImages = req.files
        ? req.files.map((file)=> `/uploads/${file.filename}`): [];

        const images = [
            uploadedImages[0] || null,
            uploadedImages[1] || null,
            uploadedImages[2] || null,  
        ];

        const product = new Product({
            name, description, price, category, stock, images
        })

        await product.save();
        res.status(201).json({ message: "Product created successfully", product });

    }
    catch(error){
        console.error(" Product creation error:", error);
        res.status(500).json({message: "Server error", error: error.message});
    }
}
// -------------------- GET ALL PRODUCTS --------------------
export const getProducts = async (req, res) => {
    try{
        const products = await Product.find().sort({created_at: -1});
        res.json(products);
    }
    catch(error){
        res.status(500).json({message: "Server error", error: error.message});
    }       
};

// -------------------- GET PRODUCT BY ID --------------------
export const getProductById = async (req, res) => {
    try{
        const { id } = req.params;
        const product = await Product.findById(id); 
        if(!product) return res.status(404).json({message: "Product not found"});

        res.json(product);
    }
    catch(error){
        console.error(" Error fetching product:", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
};


export const updateProduct = async (req, res) => {
    try{
        const { id } = req.params;
        const { name, description, price, category, stock } = req.body;

        const uploadedImages = req.files
        ? req.files.map((file) => `/uploads/${file.filename}`) : [];

        const product = await Product.findOne({_id : id});

        if(!product) return res.status(404).json({message: "Product not found"});

        if(name) product.name = name;
        if(description) product.description = description;
        if(price) product.price = price;
        if(category) product.category = category;
        if(stock) product.stock = stock;

        if(uploadedImages.length > 0){
            product.images = [
                uploadedImages[0] || product.images[0] || null,
                uploadedImages[1] || product.images[1] || null,
                uploadedImages[2] || product.images[2] || null,
            ];
        }
        await product.save();
        res.json({message: "Product updated successfully", product});


    }
    catch(error){
        console.error("Error updating product:", error.message);
        res.status(500).json({message: "Server error", error: error.message})
    }
}

// -------------------- DELETE PRODUCT --------------------

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({ message: "Product deleted successfully", product });
    } catch (error) {
        console.error("Error deleting product:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// -------------------- SEARCH PRODUCTS --------------------

export const searchProducts = async (req, res) => {
    try {
        const { name, category, minPrice, maxPrice } = req.query;
        let filter = {};

        if (name) filter.name = { $regex: name, $options: 'i' };
        if (category) filter.category = category;
        if (minPrice || maxPrice) filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);

        const products = await Product.find(filter).sort({ created_at: -1 });
        res.json(products);
    } catch (error) {
        console.error("Error searching products:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
