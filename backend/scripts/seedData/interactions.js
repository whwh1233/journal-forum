'use strict';

const { faker } = require('@faker-js/faker/locale/zh_CN');
const { PostLike, PostFavorite, PostFollow, Post, Favorite, Follow, Journal } = require('../../models');
const { Op } = require('sequelize');
const { getSeedUserIds } = require('./users');

async function seed() {
  const seedUserIds = await getSeedUserIds();
  if (seedUserIds.length === 0) {
    console.log('[seed:interactions] No seed users found, skipping.');
    return;
  }

  // Fetch all seed posts and all journals
  const posts = await Post.findAll({
    where: { userId: { [Op.in]: seedUserIds } },
    attributes: ['id']
  });
  const postIds = posts.map(p => p.id);

  const journals = await Journal.findAll({ attributes: ['journalId'] });
  const journalIds = journals.map(j => j.journalId);

  // --- Post interactions ---
  let totalLikes = 0;
  let totalFavorites = 0;
  let totalFollows = 0;

  for (const postId of postIds) {
    const likeUsers = faker.helpers.arrayElements(seedUserIds, { min: 0, max: 15 });
    const favoriteUsers = faker.helpers.arrayElements(seedUserIds, { min: 0, max: 8 });
    const followUsers = faker.helpers.arrayElements(seedUserIds, { min: 0, max: 5 });

    if (likeUsers.length > 0) {
      await PostLike.bulkCreate(
        likeUsers.map(userId => ({ postId, userId })),
        { ignoreDuplicates: true }
      );
    }

    if (favoriteUsers.length > 0) {
      await PostFavorite.bulkCreate(
        favoriteUsers.map(userId => ({ postId, userId })),
        { ignoreDuplicates: true }
      );
    }

    if (followUsers.length > 0) {
      await PostFollow.bulkCreate(
        followUsers.map(userId => ({ postId, userId })),
        { ignoreDuplicates: true }
      );
    }

    // Count actual inserted records to keep count fields accurate
    const likeCount = await PostLike.count({ where: { postId } });
    const favoriteCount = await PostFavorite.count({ where: { postId } });
    const followCount = await PostFollow.count({ where: { postId } });

    await Post.update(
      { likeCount, favoriteCount, followCount },
      { where: { id: postId } }
    );

    totalLikes += likeCount;
    totalFavorites += favoriteCount;
    totalFollows += followCount;
  }

  console.log(`[seed:interactions] Post likes created:     ${totalLikes}`);
  console.log(`[seed:interactions] Post favorites created: ${totalFavorites}`);
  console.log(`[seed:interactions] Post follows created:   ${totalFollows}`);

  // --- Journal favorites ---
  let totalJournalFavorites = 0;

  if (journalIds.length > 0) {
    for (const userId of seedUserIds) {
      const selectedJournals = faker.helpers.arrayElements(journalIds, { min: 0, max: 10 });

      if (selectedJournals.length > 0) {
        await Favorite.bulkCreate(
          selectedJournals.map(journalId => ({ userId, journalId })),
          { ignoreDuplicates: true }
        );
        totalJournalFavorites += selectedJournals.length;
      }
    }
  }

  console.log(`[seed:interactions] Journal favorites created: ${totalJournalFavorites}`);

  // --- User follows ---
  let totalUserFollows = 0;

  for (const userId of seedUserIds) {
    const others = seedUserIds.filter(id => id !== userId);
    const toFollow = faker.helpers.arrayElements(others, { min: 0, max: 15 });

    if (toFollow.length > 0) {
      await Follow.bulkCreate(
        toFollow.map(followingId => ({ followerId: userId, followingId })),
        { ignoreDuplicates: true }
      );
      totalUserFollows += toFollow.length;
    }
  }

  console.log(`[seed:interactions] User follows created: ${totalUserFollows}`);
}

async function reset() {
  const seedUserIds = await getSeedUserIds();
  if (seedUserIds.length === 0) {
    console.log('[seed:interactions] No seed users found, nothing to reset.');
    return;
  }

  const condition = { userId: { [Op.in]: seedUserIds } };

  const deletedLikes = await PostLike.destroy({ where: condition });
  const deletedFavorites = await PostFavorite.destroy({ where: condition });
  const deletedFollows = await PostFollow.destroy({ where: condition });
  const deletedJournalFavorites = await Favorite.destroy({ where: condition });
  const deletedUserFollows = await Follow.destroy({
    where: { followerId: { [Op.in]: seedUserIds } }
  });

  console.log(`[seed:interactions] Deleted ${deletedLikes} post likes.`);
  console.log(`[seed:interactions] Deleted ${deletedFavorites} post favorites.`);
  console.log(`[seed:interactions] Deleted ${deletedFollows} post follows.`);
  console.log(`[seed:interactions] Deleted ${deletedJournalFavorites} journal favorites.`);
  console.log(`[seed:interactions] Deleted ${deletedUserFollows} user follows.`);
}

module.exports = { seed, reset };
