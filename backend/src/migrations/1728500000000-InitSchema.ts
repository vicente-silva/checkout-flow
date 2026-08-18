import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1728500000000 implements MigrationInterface {
  name = 'InitSchema1728500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(150) NOT NULL,
        "description" text NOT NULL,
        "price_in_cents" integer NOT NULL,
        "image_url" varchar(500) NOT NULL,
        "sku" varchar(60) NOT NULL,
        "stock_quantity" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_products" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_products_sku" UNIQUE ("sku")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "full_name" varchar(150) NOT NULL,
        "email" varchar(150) NOT NULL,
        "phone_number" varchar(30) NOT NULL,
        "document_type" varchar(10) NOT NULL,
        "document_number" varchar(30) NOT NULL,
        CONSTRAINT "PK_customers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_customers_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "deliveries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "customer_id" uuid NOT NULL,
        "address_line" varchar(250) NOT NULL,
        "city" varchar(100) NOT NULL,
        "region" varchar(100) NOT NULL,
        "postal_code" varchar(20) NOT NULL,
        "country" varchar(60) NOT NULL DEFAULT 'Colombia',
        "delivery_fee_in_cents" integer NOT NULL,
        CONSTRAINT "PK_deliveries" PRIMARY KEY ("id"),
        CONSTRAINT "FK_deliveries_customer" FOREIGN KEY ("customer_id")
          REFERENCES "customers"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_deliveries_customer_id" ON "deliveries" ("customer_id")`);

    await queryRunner.query(`
      CREATE TYPE "transactions_status_enum" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'ERROR', 'VOIDED')
    `);

    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "reference" varchar(60) NOT NULL,
        "product_id" uuid NOT NULL,
        "customer_id" uuid NOT NULL,
        "delivery_id" uuid NOT NULL,
        "quantity" integer NOT NULL,
        "product_amount_in_cents" integer NOT NULL,
        "base_fee_in_cents" integer NOT NULL,
        "delivery_fee_in_cents" integer NOT NULL,
        "amount_in_cents" integer NOT NULL,
        "status" "transactions_status_enum" NOT NULL DEFAULT 'PENDING',
        "gateway_transaction_id" varchar(100),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_transactions_reference" UNIQUE ("reference"),
        CONSTRAINT "FK_transactions_product" FOREIGN KEY ("product_id")
          REFERENCES "products"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_transactions_customer" FOREIGN KEY ("customer_id")
          REFERENCES "customers"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_transactions_delivery" FOREIGN KEY ("delivery_id")
          REFERENCES "deliveries"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_product_id" ON "transactions" ("product_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_customer_id" ON "transactions" ("customer_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_status" ON "transactions" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "transactions_status_enum"`);
    await queryRunner.query(`DROP TABLE "deliveries"`);
    await queryRunner.query(`DROP TABLE "customers"`);
    await queryRunner.query(`DROP TABLE "products"`);
  }
}
