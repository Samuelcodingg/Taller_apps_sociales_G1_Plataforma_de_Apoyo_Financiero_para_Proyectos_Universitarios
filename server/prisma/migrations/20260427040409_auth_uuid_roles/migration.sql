-- CreateTable
CREATE TABLE `account` (
    `id_account` CHAR(36) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `email_verified` BOOLEAN NOT NULL DEFAULT false,
    `provider` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `last_login_at` TIMESTAMP(0) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `account_email_key`(`email`),
    PRIMARY KEY (`id_account`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id_role` CHAR(36) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id_role`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account_roles` (
    `id_account` CHAR(36) NOT NULL,
    `id_role` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id_account`, `id_role`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profile` (
    `id_profile` INTEGER NOT NULL AUTO_INCREMENT,
    `id_account` CHAR(36) NOT NULL,
    `names` VARCHAR(150) NOT NULL,
    `surnames` VARCHAR(150) NOT NULL,
    `birth_date` DATE NOT NULL,
    `professional_career` VARCHAR(150) NULL,
    `photo_url` TEXT NULL,
    `biography` TEXT NULL,

    UNIQUE INDEX `profile_id_account_key`(`id_account`),
    PRIMARY KEY (`id_profile`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `social_media` (
    `id_social_media` INTEGER NOT NULL AUTO_INCREMENT,
    `id_profile` INTEGER NOT NULL,
    `link` TEXT NOT NULL,

    PRIMARY KEY (`id_social_media`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaign` (
    `id_campaign` INTEGER NOT NULL AUTO_INCREMENT,
    `id_creator` CHAR(36) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `goal_amount` DECIMAL(10, 2) NOT NULL,
    `current_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `status` VARCHAR(50) NOT NULL,
    `end_date` DATETIME(0) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id_campaign`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category` (
    `id_category` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id_category`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaign_category` (
    `id_campaign` INTEGER NOT NULL,
    `id_category` INTEGER NOT NULL,

    PRIMARY KEY (`id_campaign`, `id_category`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `update_campaign` (
    `id_update_campaign` INTEGER NOT NULL AUTO_INCREMENT,
    `id_campaign` INTEGER NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `message` TEXT NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id_update_campaign`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaign_media` (
    `id_campaign_media` INTEGER NOT NULL AUTO_INCREMENT,
    `id_campaign` INTEGER NOT NULL,
    `type_media` VARCHAR(50) NOT NULL,
    `media_url` TEXT NOT NULL,

    PRIMARY KEY (`id_campaign_media`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comment_campaign` (
    `id_comment_campaign` INTEGER NOT NULL AUTO_INCREMENT,
    `id_campaign` INTEGER NOT NULL,
    `id_account` CHAR(36) NOT NULL,
    `content` TEXT NOT NULL,
    `parent_id` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id_comment_campaign`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `donation` (
    `id_donation` INTEGER NOT NULL AUTO_INCREMENT,
    `id_campaign` INTEGER NOT NULL,
    `id_donor` CHAR(36) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `is_anonymous` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id_donation`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment` (
    `id_payment` INTEGER NOT NULL AUTO_INCREMENT,
    `id_donation` INTEGER NOT NULL,
    `payment_method` VARCHAR(100) NOT NULL,
    `transaction_id` VARCHAR(150) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id_payment`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `account_roles` ADD CONSTRAINT `account_roles_id_account_fkey` FOREIGN KEY (`id_account`) REFERENCES `account`(`id_account`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_roles` ADD CONSTRAINT `account_roles_id_role_fkey` FOREIGN KEY (`id_role`) REFERENCES `roles`(`id_role`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profile` ADD CONSTRAINT `profile_id_account_fkey` FOREIGN KEY (`id_account`) REFERENCES `account`(`id_account`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `social_media` ADD CONSTRAINT `social_media_id_profile_fkey` FOREIGN KEY (`id_profile`) REFERENCES `profile`(`id_profile`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign` ADD CONSTRAINT `campaign_id_creator_fkey` FOREIGN KEY (`id_creator`) REFERENCES `account`(`id_account`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_category` ADD CONSTRAINT `campaign_category_id_campaign_fkey` FOREIGN KEY (`id_campaign`) REFERENCES `campaign`(`id_campaign`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_category` ADD CONSTRAINT `campaign_category_id_category_fkey` FOREIGN KEY (`id_category`) REFERENCES `category`(`id_category`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `update_campaign` ADD CONSTRAINT `update_campaign_id_campaign_fkey` FOREIGN KEY (`id_campaign`) REFERENCES `campaign`(`id_campaign`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_media` ADD CONSTRAINT `campaign_media_id_campaign_fkey` FOREIGN KEY (`id_campaign`) REFERENCES `campaign`(`id_campaign`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment_campaign` ADD CONSTRAINT `comment_campaign_id_campaign_fkey` FOREIGN KEY (`id_campaign`) REFERENCES `campaign`(`id_campaign`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment_campaign` ADD CONSTRAINT `comment_campaign_id_account_fkey` FOREIGN KEY (`id_account`) REFERENCES `account`(`id_account`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment_campaign` ADD CONSTRAINT `comment_campaign_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `comment_campaign`(`id_comment_campaign`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `donation` ADD CONSTRAINT `donation_id_campaign_fkey` FOREIGN KEY (`id_campaign`) REFERENCES `campaign`(`id_campaign`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `donation` ADD CONSTRAINT `donation_id_donor_fkey` FOREIGN KEY (`id_donor`) REFERENCES `account`(`id_account`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_id_donation_fkey` FOREIGN KEY (`id_donation`) REFERENCES `donation`(`id_donation`) ON DELETE CASCADE ON UPDATE CASCADE;
