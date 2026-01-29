import "dotenv/config"; // <-- esto carga .env antes que todo

import app from "./app.js";
import { connectDB } from "./db.js";

const PORT = process.env.PORT || 3001;

await connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
