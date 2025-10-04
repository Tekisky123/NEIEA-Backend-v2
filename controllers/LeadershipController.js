import Leadership from "../models/Leadership.js";

export const getMemberBio = async (req, res) => {
    try {
        const { slug } = req.params;
        const member = await Leadership.findOne({
            slug,
            is_active: true,
            show_bio: true
        });

        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        // Get related members from same category
        const relatedMembers = await Leadership.find({
            category: member.category,
            _id: { $ne: member._id },
            is_active: true
        }).sort({ display_order: 1 }).limit(6);

        res.json({
            member,
            relatedMembers
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};