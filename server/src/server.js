import { app } from "./app.js";
import { logger } from "./logger.js";

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  logger.info(`Server is listening on http://localhost:${PORT}`);
});
