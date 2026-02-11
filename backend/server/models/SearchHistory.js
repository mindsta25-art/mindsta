import mongoose from 'mongoose';

const SearchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
    // Normalized query for matching (lowercase, trimmed)
    normalizedQuery: {
      type: String,
      required: true,
      index: true,
    },
    // Metadata about the search
    filters: {
      grade: String,
      subject: String,
      term: String,
    },
    // Track if the search led to an action
    resultClicked: {
      type: Boolean,
      default: false,
    },
    clickedCourse: {
      subject: String,
      grade: String,
      term: String,
    },
    searchCount: {
      type: Number,
      default: 1,
    },
    lastSearchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user + query lookups
SearchHistorySchema.index({ userId: 1, normalizedQuery: 1 });
SearchHistorySchema.index({ userId: 1, lastSearchedAt: -1 });

// Static method to record a search
SearchHistorySchema.statics.recordSearch = async function(userId, query, filters = {}) {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Check if this exact search already exists for the user
  const existingSearch = await this.findOne({
    userId,
    normalizedQuery,
  });

  if (existingSearch) {
    // Update existing search
    existingSearch.searchCount += 1;
    existingSearch.lastSearchedAt = new Date();
    existingSearch.filters = filters;
    await existingSearch.save();
    return existingSearch;
  } else {
    // Create new search record
    return await this.create({
      userId,
      query,
      normalizedQuery,
      filters,
    });
  }
};

// Static method to get user's search keywords
SearchHistorySchema.statics.getUserSearchKeywords = async function(userId, limit = 50) {
  return await this.find({ userId })
    .sort({ lastSearchedAt: -1 })
    .limit(limit)
    .select('query normalizedQuery searchCount lastSearchedAt')
    .lean();
};

// Static method to get popular search terms across all users
SearchHistorySchema.statics.getPopularSearches = async function(limit = 20) {
  return await this.aggregate([
    {
      $group: {
        _id: '$normalizedQuery',
        query: { $first: '$query' },
        totalSearches: { $sum: '$searchCount' },
        uniqueUsers: { $addToSet: '$userId' },
      },
    },
    {
      $project: {
        query: 1,
        totalSearches: 1,
        userCount: { $size: '$uniqueUsers' },
      },
    },
    { $sort: { totalSearches: -1 } },
    { $limit: limit },
  ]);
};

export default mongoose.models.SearchHistory || mongoose.model('SearchHistory', SearchHistorySchema);
