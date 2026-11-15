import { app } from "./app.js";
import { logger } from "./logger.js";

const PORT = Number(process.env.PORT) || 3000;

// In Express 5 this callback also runs when listening fails
// (for example when the port is taken), with the error as its argument.
app.listen(PORT, (err) => {
  if (err) {
    logger.error(`The server could not start: ${err.message}`);
    process.exit(1);
  }
  logger.info(`Server is listening on http://localhost:${PORT}`);
});
