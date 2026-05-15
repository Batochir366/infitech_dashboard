-- CreateTable
CREATE TABLE `rental_agreements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientId` INTEGER NOT NULL,
    `status` ENUM('active', 'cancelled') NOT NULL DEFAULT 'active',
    `cancelledAt` DATETIME(3) NULL,
    `leaseStartAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `rentDurationMonths` INTEGER NOT NULL DEFAULT 12,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rental_agreements_clientId_key`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_agreements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientId` INTEGER NOT NULL,
    `totalPrice` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `purchase_agreements_clientId_key`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_installments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `purchaseAgreementId` INTEGER NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable (invoices): add index on clientId so FK stays valid when composite unique is removed
CREATE INDEX `invoices_clientId_idx` ON `invoices`(`clientId`);

DROP INDEX `invoices_clientId_scheduleYear_scheduleMonth_scheduleDay_key` ON `invoices`;

ALTER TABLE `invoices` ADD COLUMN `rentPeriodKey` VARCHAR(191) NULL;
ALTER TABLE `invoices` ADD COLUMN `purchaseInstallmentId` INTEGER NULL;

-- Backfill rent-style uniqueness key for existing invoices
UPDATE `invoices`
SET `rentPeriodKey` = CONCAT(`clientId`, '|', `scheduleYear`, '|', `scheduleMonth`, '|', `scheduleDay`)
WHERE `rentPeriodKey` IS NULL;

CREATE UNIQUE INDEX `invoices_rentPeriodKey_key` ON `invoices`(`rentPeriodKey`);
CREATE UNIQUE INDEX `invoices_purchaseInstallmentId_key` ON `invoices`(`purchaseInstallmentId`);

-- AlterTable payment_schedules: link to rental
ALTER TABLE `payment_schedules` ADD COLUMN `rentalAgreementId` INTEGER NULL;

-- Rent clients: one rental agreement per client
INSERT INTO `rental_agreements` (`clientId`, `status`, `cancelledAt`, `leaseStartAt`, `rentDurationMonths`, `createdAt`, `updatedAt`)
SELECT
    c.`id`,
    'active',
    NULL,
    c.`createdAt`,
    12,
    NOW(3),
    NOW(3)
FROM `clients` c
WHERE c.`paymentType` = 'rent';

UPDATE `payment_schedules` ps
INNER JOIN `clients` c ON c.`id` = ps.`clientId`
INNER JOIN `rental_agreements` ra ON ra.`clientId` = c.`id`
SET ps.`rentalAgreementId` = ra.`id`
WHERE c.`paymentType` = 'rent';

-- Buy clients: purchase agreement + installments from old schedules; remove schedule rows
INSERT INTO `purchase_agreements` (`clientId`, `totalPrice`, `createdAt`, `updatedAt`)
SELECT
    c.`id`,
    COALESCE((SELECT SUM(ps.`amount`) FROM `payment_schedules` ps WHERE ps.`clientId` = c.`id`), 0),
    NOW(3),
    NOW(3)
FROM `clients` c
WHERE c.`paymentType` = 'buy';

INSERT INTO `purchase_installments` (`purchaseAgreementId`, `dueDate`, `amount`, `sortOrder`)
SELECT
    pa.`id`,
    STR_TO_DATE(
        CONCAT(
            YEAR(c.`createdAt`), '-',
            LPAD(MONTH(c.`createdAt`), 2, '0'), '-',
            LPAD(
                LEAST(ps.`day`, DAY(LAST_DAY(c.`createdAt`))),
                2,
                '0'
            )
        ),
        '%Y-%m-%d'
    ),
    ps.`amount`,
    ps.`id`
FROM `payment_schedules` ps
INNER JOIN `clients` c ON c.`id` = ps.`clientId`
INNER JOIN `purchase_agreements` pa ON pa.`clientId` = c.`id`
WHERE c.`paymentType` = 'buy';

DELETE ps FROM `payment_schedules` ps
INNER JOIN `clients` c ON c.`id` = ps.`clientId`
WHERE c.`paymentType` = 'buy';

-- Drop old clientId from payment_schedules
ALTER TABLE `payment_schedules` DROP FOREIGN KEY `payment_schedules_clientId_fkey`;

ALTER TABLE `payment_schedules` DROP COLUMN `clientId`;

ALTER TABLE `payment_schedules` MODIFY `rentalAgreementId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `rental_agreements` ADD CONSTRAINT `rental_agreements_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_agreements` ADD CONSTRAINT `purchase_agreements_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_installments` ADD CONSTRAINT `purchase_installments_purchaseAgreementId_fkey` FOREIGN KEY (`purchaseAgreementId`) REFERENCES `purchase_agreements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_schedules` ADD CONSTRAINT `payment_schedules_rentalAgreementId_fkey` FOREIGN KEY (`rentalAgreementId`) REFERENCES `rental_agreements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_purchaseInstallmentId_fkey` FOREIGN KEY (`purchaseInstallmentId`) REFERENCES `purchase_installments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
