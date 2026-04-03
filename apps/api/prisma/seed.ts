import { PrismaClient } from '@prisma/client';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const conditions = require('../../../packages/shared/data/conditions.json');
const languages = require('../../../packages/shared/data/languages.json');
const weapons = require('../../../packages/shared/data/weapons.json');
const armor = require('../../../packages/shared/data/armor.json');
const species = require('../../../packages/shared/data/species.json');
const backgrounds = require('../../../packages/shared/data/backgrounds.json');
const feats = require('../../../packages/shared/data/feats.json');
const classes = require('../../../packages/shared/data/classes.json');
const spells = require('../../../packages/shared/data/spells.json');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding reference data...');

  for (const condition of conditions) {
    await prisma.condition.upsert({
      where: { name: condition.name },
      update: condition,
      create: condition,
    });
  }
  console.log(`✓ ${conditions.length} conditions`);

  for (const lang of languages) {
    await prisma.language.upsert({
      where: { name: lang.name },
      update: lang,
      create: lang,
    });
  }
  console.log(`✓ ${languages.length} languages`);

  for (const weapon of weapons) {
    await prisma.weapon.upsert({
      where: { name: weapon.name },
      update: weapon,
      create: weapon,
    });
  }
  console.log(`✓ ${weapons.length} weapons`);

  for (const armorItem of armor) {
    await prisma.armor.upsert({
      where: { name: armorItem.name },
      update: armorItem,
      create: armorItem,
    });
  }
  console.log(`✓ ${armor.length} armor items`);

  for (const sp of species) {
    await prisma.species.upsert({
      where: { name: sp.name },
      update: sp,
      create: sp,
    });
  }
  console.log(`✓ ${species.length} species`);

  for (const bg of backgrounds) {
    await prisma.background.upsert({
      where: { name: bg.name },
      update: bg,
      create: bg,
    });
  }
  console.log(`✓ ${backgrounds.length} backgrounds`);

  for (const feat of feats) {
    await prisma.feat.upsert({
      where: { name: feat.name },
      update: feat,
      create: feat,
    });
  }
  console.log(`✓ ${feats.length} feats`);

  for (const cls of classes) {
    const { subclasses: subclassData, ...classData } = cls;

    const savedClass = await prisma.dndClass.upsert({
      where: { name: classData.name },
      update: classData,
      create: classData,
    });

    if (subclassData && Array.isArray(subclassData)) {
      for (const sub of subclassData) {
        await prisma.subclass.upsert({
          where: { classId_name: { classId: savedClass.id, name: sub.name } },
          update: { ...sub, classId: savedClass.id },
          create: { ...sub, classId: savedClass.id },
        });
      }
    }
  }
  console.log(`✓ ${classes.length} classes`);

  for (const spell of spells) {
    await prisma.spell.upsert({
      where: { name: spell.name },
      update: spell,
      create: spell,
    });
  }
  console.log(`✓ ${spells.length} spells`);

  console.log('Seed complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
