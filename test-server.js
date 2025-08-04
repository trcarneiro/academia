const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.static("public"));

app.get("/api/billing-plans", (req, res) => {
    res.json({
        success: true,
        data: [{
            id: "1",
            name: "Plano Básico",
            price: 99.90,
            billingType: "MONTHLY",
            classesPerWeek: 2,
            isActive: true
        }]
    });
});

app.listen(PORT, () => {
    console.log("Server running at http://localhost:" + PORT);
});
