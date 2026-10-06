import "reflect-metadata";

import { Controller, Get, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import dataSource from "./database/data-source.js";

@Controller("health")
class HealthController {
  @Get()
  health(): { status: "ok" } {
    return { status: "ok" };
  }

  // Round-trips to Postgres and reads the row the migration wrote, so a green
  // result proves migrations ran too.
  @Get("db")
  async db(): Promise<{ database: "ok" }> {
    if (!dataSource.isInitialized) await dataSource.initialize();
    await dataSource.query('SELECT 1 FROM "ping" LIMIT 1');
    return { database: "ok" };
  }
}

@Module({ controllers: [HealthController] })
class AppModule {}

const app = await NestFactory.create(AppModule);
app.setGlobalPrefix("api/v1");
await app.listen(Number(process.env.PORT ?? 3000), "0.0.0.0");
