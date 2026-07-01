const analyticsModel = require('../models/analyticsModel');

async function getOverview(req, res) {
  try {
    const [overview, quality] = await Promise.all([analyticsModel.getOverview(), analyticsModel.getDataQuality()]);
    res.json({ ...overview, dataQuality: quality });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getStageBreakdown(req, res) {
  try {
    const breakdown = await analyticsModel.getStageBreakdown();
    res.json(breakdown);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getStatusBreakdown(req, res) {
  try {
    const breakdown = await analyticsModel.getStatusBreakdown();
    res.json(breakdown);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getTimeline(req, res) {
  try {
    const timeline = await analyticsModel.getTimeline();
    res.json(timeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getRecentActivity(req, res) {
  try {
    const activity = await analyticsModel.getRecentActivity();
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getDataQuality(req, res) {
  try {
    const quality = await analyticsModel.getDataQuality();
    res.json(quality);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { getOverview, getStageBreakdown, getStatusBreakdown, getTimeline, getRecentActivity, getDataQuality };
