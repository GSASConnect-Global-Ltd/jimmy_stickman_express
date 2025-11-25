//admin Middleware to check for admin role
const adminMiddleware = (req, res, next) => {
    if(req.userRole !== "admin"){
        return res.status(403).json({message: "Access denied. Admins only."});
    }

    next();
}

export default adminMiddleware;