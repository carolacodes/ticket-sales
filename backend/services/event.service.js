import Event from "../models/event.model.js";

export async function createEvent(data) {
    return await Event.create(data);
}

export async function findPublishedEvents() {
    return await Event.find({ status: "PUBLISHED" }).sort({ startAt: 1 });
}

export async function findEventById(id) {
    return await Event.findById(id);
}

export async function findEventsByOrganizerId(organizerId) {
    return await Event.find({ organizerId }).sort({ createdAt: -1 });
}

export async function updateEventById(id, update) {
    return await Event.findByIdAndUpdate(id, update, { new: true });
}


export async function listPublishedEventsCatalog({
  q,
  tags = [],
  dateFrom,
  dateTo,
  minPrice,
  maxPrice,
  page = 1,
  limit = 12,
}) {
  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedLimit = Math.max(1, Math.min(50, Number(limit) || 12));
  const skip = (parsedPage - 1) * parsedLimit;

  const match = {
    status: "PUBLISHED",
  };

  if (q?.trim()) {
    match.$or = [
      { title: { $regex: q.trim(), $options: "i" } },
      { description: { $regex: q.trim(), $options: "i" } },
      { venue: { $regex: q.trim(), $options: "i" } },
      { city: { $regex: q.trim(), $options: "i" } },
      { tags: { $regex: q.trim(), $options: "i" } },
    ];
  }

  if (Array.isArray(tags) && tags.length > 0) {
    match.tags = { $in: tags };
  }

  if (dateFrom || dateTo) {
    match.startAt = {};
    if (dateFrom) {
      match.startAt.$gte = new Date(`${dateFrom}T00:00:00.000Z`);
    }
    if (dateTo) {
      match.startAt.$lte = new Date(`${dateTo}T23:59:59.999Z`);
    }
  }

  const priceFilter = {};
  if (minPrice !== undefined && minPrice !== null && minPrice !== "") {
    priceFilter.$gte = Number(minPrice);
  }
  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
    priceFilter.$lte = Number(maxPrice);
  }

  const pipeline = [
    { $match: match },

    {
      $lookup: {
        from: "tickettypes",
        localField: "_id",
        foreignField: "eventId",
        as: "ticketTypes",
      },
    },

    {
      $addFields: {
        minPrice: {
          $cond: [
            { $gt: [{ $size: "$ticketTypes" }, 0] },
            { $min: "$ticketTypes.price" },
            0,
          ],
        },
      },
    },
  ];

  if (Object.keys(priceFilter).length > 0) {
    pipeline.push({
      $match: {
        minPrice: priceFilter,
      },
    });
  }

  pipeline.push(
    { $sort: { startAt: 1, createdAt: -1 } },
    {
      $facet: {
        events: [
          { $skip: skip },
          { $limit: parsedLimit },
          {
            $project: {
              _id: 1,
              title: 1,
              description: 1,
              venue: 1,
              city: 1,
              startAt: 1,
              endAt: 1,
              bannerUrl: 1,
              tags: 1,
              minPrice: 1,
              createdAt: 1,
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    }
  );

  const [result] = await Event.aggregate(pipeline);

  const total = result?.totalCount?.[0]?.count || 0;
  const events = result?.events || [];

  // Tags dinámicos: salen de TODOS los eventos publicados
  const tagsAgg = await Event.aggregate([
    { $match: { status: "PUBLISHED" } },
    { $unwind: "$tags" },
    {
      $group: {
        _id: { $trim: { input: "$tags" } },
      },
    },
    {
      $match: {
        _id: { $ne: "" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const availableTags = tagsAgg.map((x) => x._id).filter(Boolean);

  return {
    events,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / parsedLimit)),
    },
    availableTags,
  };
}