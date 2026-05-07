import Transaction from '../models/Transaction.js';
import Contact from '../models/Contact.js';

const getSummary = async (userId) => {
  const [aggregation, contactCount] = await Promise.all([
    Transaction.aggregate([
      { $match: { owner: userId._id || userId } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    Contact.countDocuments({ owner: userId._id || userId, deletedAt: null }),
  ]);

  let totalGave = 0;
  let totalReceived = 0;
  let gaveCount = 0;
  let receivedCount = 0;

  aggregation.forEach((item) => {
    if (item._id === 'gave') {
      totalGave = item.total;
      gaveCount = item.count;
    } else if (item._id === 'received') {
      totalReceived = item.total;
      receivedCount = item.count;
    }
  });

  return {
    totalGave,
    totalReceived,
    netBalance: totalGave - totalReceived,
    gaveCount,
    receivedCount,
    contactCount,
  };
};

const getMonthlyAggregation = async (userId) => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const result = await Transaction.aggregate([
    {
      $match: {
        owner: userId._id || userId,
        date: { $gte: twelveMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type',
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const monthlyData = [];
  const currentDate = new Date();

  for (let i = 11; i >= 0; i--) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;

    const gave = result.find(
      (r) => r._id.year === year && r._id.month === month && r._id.type === 'gave'
    );
    const received = result.find(
      (r) => r._id.year === year && r._id.month === month && r._id.type === 'received'
    );

    monthlyData.push({
      year,
      month,
      label: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
      gave: gave?.total || 0,
      gaveCount: gave?.count || 0,
      received: received?.total || 0,
      receivedCount: received?.count || 0,
      net: (gave?.total || 0) - (received?.total || 0),
    });
  }

  return monthlyData;
};

const getTopContacts = async (userId, limit = 5) => {
  const contacts = await Contact.find({ owner: userId._id || userId, deletedAt: null })
    .sort({ netBalance: -1 })
    .limit(limit)
    .lean();

  return contacts.map((c) => ({
    _id: c._id,
    name: c.name,
    phone: c.phone,
    netBalance: c.netBalance,
    absoluteBalance: Math.abs(c.netBalance),
  }));
};

const getCategoryBreakdown = async (userId) => {
  const result = await Transaction.aggregate([
    { $match: { owner: userId._id || userId } },
    {
      $group: {
        _id: { category: '$categoryTag', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const breakdown = {};
  result.forEach((item) => {
    const category = item._id.category;
    if (!breakdown[category]) {
      breakdown[category] = { category, gave: 0, received: 0, count: 0 };
    }
    if (item._id.type === 'gave') {
      breakdown[category].gave = item.total;
    } else {
      breakdown[category].received = item.total;
    }
    breakdown[category].count += item.count;
  });

  return Object.values(breakdown).sort((a, b) => b.gave + b.received - (a.gave + a.received));
};

export { getSummary, getMonthlyAggregation, getTopContacts, getCategoryBreakdown };
