const gethealth = (req, res) => {
         res.status(200).json({
                success: true,
                message: "E commerce api is running",
                timestamp: new Date().toISOString()
                
        });
}

module.exports = {
        gethealth
}