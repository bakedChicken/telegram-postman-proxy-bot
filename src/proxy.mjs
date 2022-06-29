import bodyParser from "body-parser";
import express from "express";
import TelegramBot from "node-telegram-bot-api";

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

const app = express();
app.use(bodyParser.json());

const apiRouter = express.Router();

apiRouter.get("/health/check", (_, res) => {
  res.sendStatus(200);
});

apiRouter.post("/postman/webhook", async (req, res) => {
  console.info(
    `Webhook has been triggered with message: ${JSON.stringify(req.body)}`
  );

  try {
    const monitorNameMessage = `Результат запуска монитора <b>${req.body.monitor_name} (${req.body.environment_name})</b>`;
    const totalRequestsMessage = `Всего запросов сделано: ${req.body.metrics.requestCount}`;
    const testStatisticsMessage = `Провалено тестов: <b><u>${req.body.metrics.failedTestCount}</u></b> / ${req.body.metrics.passedTestCount}`;
    const errorsMessage = `Ошибки/предупреждения: ${req.body.metrics.errorCount} / ${req.body.metrics.warningCount}`;
    const lastUpdatedMessage = `\n\nВремя завершения последнего теста: ${new Date().toLocaleString(
      process.env.LOCALE,
      { timeZone: process.env.TIMEZONE }
    )}`;

    if (req.body.metrics.failedTestCount > 0) {
      const message = [
        monitorNameMessage,
        totalRequestsMessage,
        testStatisticsMessage,
        errorsMessage,
      ].join("\n");

      await bot.sendMessage(process.env.CHAT_ID, message, {
        parse_mode: "HTML",
      });

      console.info(
        `Sent message to chat ${process.env.CHAT_ID}: ${JSON.stringify(
          message
        )}`
      );
    } else {
      const message = [
        monitorNameMessage,
        totalRequestsMessage,
        testStatisticsMessage,
        errorsMessage,
        lastUpdatedMessage,
      ].join("\n");

      await bot.editMessageText(message, {
        chat_id: process.env.CHAT_ID,
        message_id: process.env.PINNED_MESSAGE_ID,
        parse_mode: "HTML",
      });

      console.info(
        `Changed message ${process.env.PINNED_MESSAGE_ID} in chat ${
          process.env.CHAT_ID
        }: ${JSON.stringify(message)}`
      );
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.use("/api", apiRouter);

app.listen(process.env.PORT, "0.0.0.0", () => {
  console.info(`Proxy is listening on port: ${process.env.PORT}`);
});
