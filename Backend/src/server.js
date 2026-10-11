require("dotenv").config();

const app = require("./app");

const port = process.env.PORT || 5000;

app.listen(port,()=>{
    console.log(`server started on port ${port} URL : http://localhost:${port}`);
    console.log(`server started on port ${port} URL : http://localhost:${port}/api/health`);
        console.log(`server started on port ${port} URL : http://localhost:${port}/api/database`);


});
