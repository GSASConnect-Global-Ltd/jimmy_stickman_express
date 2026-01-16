import Product from '../models/Product.js';

// Helper to safely format colors array
const formatColors = (colors) => {
  if (!Array.isArray(colors)) return [];
  return colors.map(c => ({
    name: c.name || "",
    value: c.value || "#000000",
  }));
};


// -------------------- CREATE PRODUCT --------------------
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      brand,
      material,
      gender,
      sizes,
      colors,
      sku,
      stockBySize
    } = req.body;

    const uploadedImages = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

    const images = [
      uploadedImages[0] || null,
      uploadedImages[1] || null,
      uploadedImages[2] || null,
    ];

    const product = new Product({
        name,
        description,
        price,
        brand,
        material,
        gender,
        colors: colors ? formatColors(JSON.parse(colors)) : [],
        sizes: sizes ? JSON.parse(sizes) : [],
        stockBySize: stockBySize ? JSON.parse(stockBySize) : [],
        sku,
        images,
        });


    await product.save();

    res.status(201).json({ message: "Product created successfully", product });

  } catch (error) {
    console.error("Product creation error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
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
    try {
        const { id } = req.params;
        const {
            name,
            description,
            price,
            brand,
            material,
            gender,
            sizes,
            colors,
            sku,
            stockBySize
        } = req.body;

        const uploadedImages = req.files
            ? req.files.map((file) => `/uploads/${file.filename}`)
            : [];

        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        // Update all fields if provided
        if (name) product.name = name;
        if (description) product.description = description;
        if (price) product.price = price;
        if (brand) product.brand = brand;
        if (material) product.material = material;
        if (gender) product.gender = gender;
        if (sizes) product.sizes = JSON.parse(sizes);
        if (colors) product.colors = formatColors(JSON.parse(colors));
        if (sku) product.sku = sku;
        if (stockBySize) product.stockBySize = JSON.parse(stockBySize);

        // Update images if new ones uploaded
        if (uploadedImages.length > 0) {
            product.images = [
                uploadedImages[0] || product.images[0] || null,
                uploadedImages[1] || product.images[1] || null,
                uploadedImages[2] || product.images[2] || null,
            ];
        }

        await product.save();
        res.json({ message: "Product updated successfully", product });
    } catch (error) {
        console.error("Error updating product:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

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




// -------------------- SEARCH PRODUCTS (LIVE) --------------------
export const searchProducts = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.json([]); // no query, return empty array

    const products = await Product.find({
      name: { $regex: name, $options: "i" },
    }).limit(5); // limit to 5 suggestions for speed

    res.json(products);
  } catch (error) {
    console.error("Error searching products:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- DELETE MULTIPLE PRODUCTS --------------------

export const deleteMultipleProducts = async (req, res) => {
    try {
        const { ids } = req.body; // expecting array of product IDs

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "No product IDs provided" });
        }

        const result = await Product.deleteMany({ _id: { $in: ids } });

        res.json({
            message: `${result.deletedCount} products deleted successfully`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error("Batch delete error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const filterProducts = async (req, res) => {
  try {
    const {
      name,
      brand,
      material,
      category,
      gender,
      minPrice,
      maxPrice,
      colors,
      sizes,
      sku,
      inStock,
    } = req.query;

    let filter = {};

    if (name) filter.name = { $regex: name, $options: "i" };
    if (brand) filter.brand = { $regex: brand, $options: "i" };
    if (material) filter.material = { $regex: material, $options: "i" };
    if (category) filter.material = { $regex: category, $options: "i" }; // map category to material or add proper field
    if (sku) filter.sku = { $regex: sku, $options: "i" };
    if (gender) filter.gender = gender;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (colors) {
      const colorList = colors.split(",").map(c => c.trim());
      filter["colors.name"] = { $in: colorList }; // ✅ match nested object field
    }

    if (sizes) {
      const sizeList = sizes.split(",").map(s => s.trim());
      filter.sizes = { $in: sizeList };
    }

    if (inStock === "true") {
      filter["stockBySize.quantity"] = { $gt: 0 };
    }

    const products = await Product.find(filter).sort({ created_at: -1 });
    res.json({ count: products.length, products });

  } catch (error) {
    console.error("Dynamic filter error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


