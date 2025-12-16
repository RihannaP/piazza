import express from "express";
import Post from "../models/Post.js";
import { auth } from "../middleware/verifyToken.js";

const router = express.Router();

const isExpired = (post) => new Date() > new Date(post.expiresAt);
const timeLeftMs = (post) => Math.max(0, new Date(post.expiresAt) - new Date());
const timeLeftSeconds = (post) => Math.floor(timeLeftMs(post) / 1000);

const groupByUser = (arr = []) => {
  const result = {};
  for (const item of arr) {
    const name = item.username || "unknown";
    result[name] = (result[name] || 0) + 1;
  }
  return result;
};

// POST(create) /posts  (Action 2: create post)
router.post("/", auth, async (req, res) => {
  try {
    const { title, topics, body, expirationMinutes } = req.body;

    if (!title || !topics || !body || !expirationMinutes) {
      return res
        .status(400)
        .json({ error: "title, topics, body, expirationMinutes are required" });
    }

    // topics must be array and contain allowed values (enum)
    const allowed = ["Politics", "Health", "Sport", "Tech"];
    const topicsArr = Array.isArray(topics) ? topics : [topics];
    const invalid = topicsArr.find((t) => !allowed.includes(t));
    if (invalid) {
      return res.status(400).json({ error: `Invalid topic: ${invalid}` });
    }

    const mins = Number(expirationMinutes);
    if (!Number.isFinite(mins) || mins <= 0) {
      return res
        .status(400)
        .json({ error: "expirationMinutes must be a number > 0" });
    }

    const expiresAt = new Date(Date.now() + mins * 60 * 1000);

    const post = await Post.create({
      title,
      topics: topicsArr,
      body,
      expiresAt,
      status: "Live",
      owner: {
        userId: req.user.userId,
        username: req.user.username,
      },
      likes: [],
      dislikes: [],
      comments: [],
    });

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/// Like endpoint

router.post("/:id/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // mark expired if time passed
    if (isExpired(post)) {
      post.status = "Expired";
      await post.save();
      return res.status(403).json({ error: "Post expired - cannot like" });
    }

    // owner cannot like
    if (String(post.owner.userId) === String(req.user.userId)) {
      return res
        .status(403)
        .json({ error: "Owner cannot like their own post" });
    }

    // remove from dislikes if present
    post.dislikes = post.dislikes.filter(
      (u) => String(u) !== String(req.user.userId)
    );

    // toggle like
    const already = post.likes.some(
      (u) => String(u.userId) === String(req.user.userId)
    );
    if (already) {
      post.likes = post.likes.filter(
        (u) => String(u.userId) !== String(req.user.userId)
      );
    } else {
      post.likes.push({
        userId: req.user.userId,
        username: req.user.username,
        type: "like",
        timeLeftSeconds: timeLeftSeconds(post),
      });
    }

    await post.save();
    res.json(post.likes[post.likes.length - 1]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/// Dislike endpoint

router.post("/:id/dislike", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (isExpired(post)) {
      post.status = "Expired";
      await post.save();
      return res.status(403).json({ error: "Post expired - cannot dislike" });
    }

    if (String(post.owner.userId) === String(req.user.userId)) {
      return res
        .status(403)
        .json({ error: "Owner cannot dislike their own post" });
    }

    post.likes = post.likes.filter(
      (u) => String(u) !== String(req.user.userId)
    );

    const already = post.dislikes.some(
      (u) => String(u.userId) === String(req.user.userId)
    );
    if (already) {
      post.dislikes = post.dislikes.filter(
        (u) => String(u.userId) !== String(req.user.userId)
      );
    } else {
      post.dislikes.push({
        userId: req.user.userId,
        username: req.user.username,
        type: "dislike",
        timeLeftSeconds: timeLeftSeconds(post),
      });
    }

    await post.save();
    res.json(post.dislikes[post.dislikes.length - 1]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

///Comment endpoint

router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "text is required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (isExpired(post)) {
      post.status = "Expired";
      await post.save();
      return res.status(403).json({ error: "Post expired - cannot comment" });
    }

    post.comments.push({
      userId: req.user.userId,
      username: req.user.username,
      type: "comment",
      value: text,
      timeLeftSeconds: timeLeftSeconds(post),
    });

    await post.save();
    res.status(201).json(post.comments[post.comments.length - 1]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// /posts/active/most-interesting?topic=Tech
router.get("/active/most-interesting", auth, async (req, res) => {
  try {
    const { topic } = req.query;
    if (!topic)
      return res
        .status(400)
        .json({ error: "topic query parameter is required" });

    const allowed = ["Politics", "Health", "Sport", "Tech"];
    if (!allowed.includes(topic))
      return res.status(400).json({ error: "Invalid topic" });

    const posts = await Post.find({ topics: topic, status: "Live" });

    if (posts.length === 0) {
      return res.json({ message: "No active posts for this topic" });
    }

    // choose post with max (likes + dislikes)
    let best = posts[0];
    let bestScore = (best.likes?.length || 0) + (best.dislikes?.length || 0);

    for (const p of posts) {
      const score = (p.likes?.length || 0) + (p.dislikes?.length || 0);
      if (score > bestScore) {
        best = p;
        bestScore = score;
      }
    }

    return res.json({ post: best, score: bestScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// /posts/expired?topic=Tech
router.get("/expired", auth, async (req, res) => {
  try {
    const { topic } = req.query;
    if (!topic)
      return res
        .status(400)
        .json({ error: "topic query parameter is required" });

    const allowed = ["Politics", "Health", "Sport", "Tech"];
    if (!allowed.includes(topic))
      return res.status(400).json({ error: "Invalid topic" });

    const expiredPosts = await Post.find({
      topics: topic,
      status: "Expired",
    }).sort({ expiresAt: -1 });

    return res.json(expiredPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET (Read) /posts?topic=Tech (Action 3: browse by topic)
router.get("/", auth, async (req, res) => {
  try {
    const { topic } = req.query;

    if (!topic) {
      return res
        .status(400)
        .json({ error: "topic query parameter is required" });
    }

    const allowed = ["Politics", "Health", "Sport", "Tech"];
    if (!allowed.includes(topic)) {
      return res.status(400).json({ error: "Invalid topic" });
    }

    //auto mark expired
    await Post.updateMany(
      { status: "Live", expiresAt: { $lt: new Date() } },
      { $set: { status: "Expired" } }
    );

    const posts = await Post.find({ topics: topic }).sort({ createdAt: -1 });
    const response = posts.map((post) => {
      const likesByUser = groupByUser(post.likes);
      const dislikesByUser = groupByUser(post.dislikes);
      const commentsByUser = groupByUser(post.comments);

      const commentsList = post.comments.map((c) => ({
        userId: c.userId,
        username: c.username,
        text: c.value,
        timeLeftSeconds: c.timeLeftSeconds,
        createdAt: c.createdAt,
      }));

      return {
        id: post._id,
        title: post.title,
        topics: post.topics,
        status: post.status,
        owner: {
          userId: post.owner.userId,
          username: post.owner.username,
        },

        interactions: {
          totals: {
            likes: post.likes.length || 0,
            dislikes: post.dislikes.length || 0,
            comments: post.comments.length || 0,
          },
          grouped: {
            likes: likesByUser,
            dislikes: dislikesByUser,
            comments: commentsByUser,
          },
        },
        comments: commentsList,
      };
    });

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
